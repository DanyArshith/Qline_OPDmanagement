const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const integrationEnabled = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const cookieName = process.env.REFRESH_COOKIE_NAME || 'qline_rt';

if (!integrationEnabled) {
    test(
        'integration suite disabled',
        { skip: 'Set ENABLE_INTEGRATION_TESTS=true to run integration tests' },
        () => {}
    );
} else {
    const {
        ensureTestEnv,
        connectTestDb,
        clearTestDb,
        disconnectTestDb,
        isReplicaSetConnection,
    } = require('../helpers/testDb');
    const { createTestApp } = require('../helpers/createTestApp');

    ensureTestEnv();

    const app = createTestApp();
    let transactionCapable = false;
    let dbAvailable = false;
    let dbConnectError = null;

    const registerUser = async (agent, payload) => {
        const res = await agent.post('/api/auth/register').send(payload);
        assert.equal(res.status, 201, `register failed: ${JSON.stringify(res.body)}`);
        assert.ok(res.body.accessToken, 'accessToken missing on register');
        assert.ok(res.body.user, 'user missing on register');
        return res;
    };

    before(async () => {
        try {
            await connectTestDb();
            transactionCapable = await isReplicaSetConnection();
            dbAvailable = true;
        } catch (error) {
            dbConnectError = error;
            dbAvailable = false;
        }
    });

    beforeEach(async () => {
        if (!dbAvailable) {
            return;
        }
        await clearTestDb();
    });

    after(async () => {
        if (!dbAvailable) {
            return;
        }
        await clearTestDb();
        await disconnectTestDb();
    });

    test('auth uses secure refresh cookie flow', async (t) => {
        if (!dbAvailable) {
            t.skip(`MongoDB unavailable for integration tests: ${dbConnectError?.message || 'unknown error'}`);
            return;
        }

        const agent = request.agent(app);
        const unique = Date.now();

        const registerRes = await registerUser(agent, {
            name: 'Cookie Test Patient',
            email: `cookie.patient.${unique}@example.com`,
            password: 'Password123!',
            role: 'patient',
        });

        assert.equal(registerRes.body.refreshToken, undefined, 'refreshToken should not be in response');
        assert.ok(
            registerRes.headers['set-cookie']?.some((value) => value.startsWith(`${cookieName}=`)),
            'refresh cookie was not set on register'
        );

        const refreshRes = await agent.post('/api/auth/refresh').send({});
        assert.equal(refreshRes.status, 200, `refresh failed: ${JSON.stringify(refreshRes.body)}`);
        assert.ok(refreshRes.body.accessToken, 'refresh did not return access token');
        assert.ok(
            refreshRes.headers['set-cookie']?.some((value) => value.startsWith(`${cookieName}=`)),
            'refresh cookie was not rotated'
        );

        const logoutRes = await agent.post('/api/auth/logout').send({});
        assert.equal(logoutRes.status, 200, `logout failed: ${JSON.stringify(logoutRes.body)}`);
        assert.ok(
            logoutRes.headers['set-cookie']?.some((value) => value.includes(`${cookieName}=;`)),
            'logout did not clear refresh cookie'
        );
    });

    test('doctor can serve a booked patient through queue lifecycle', async (t) => {
        if (!dbAvailable) {
            t.skip(`MongoDB unavailable for integration tests: ${dbConnectError?.message || 'unknown error'}`);
            return;
        }

        if (!transactionCapable) {
            t.skip('MongoDB replica set is required for appointment/queue transaction tests');
            return;
        }

        const doctorAgent = request.agent(app);
        const patientAgent = request.agent(app);
        const unique = Date.now();

        const doctorRegister = await registerUser(doctorAgent, {
            name: 'Queue Doctor',
            email: `queue.doctor.${unique}@example.com`,
            password: 'Password123!',
            role: 'doctor',
        });

        const patientRegister = await registerUser(patientAgent, {
            name: 'Queue Patient',
            email: `queue.patient.${unique}@example.com`,
            password: 'Password123!',
            role: 'patient',
        });

        const doctorAccessToken = doctorRegister.body.accessToken;
        const patientAccessToken = patientRegister.body.accessToken;

        const doctorConfigRes = await doctorAgent
            .post('/api/doctors/configure')
            .set('Authorization', `Bearer ${doctorAccessToken}`)
            .send({
                department: 'General Medicine',
                workingHours: { start: '09:00', end: '17:00' },
                breakSlots: [],
                defaultConsultTime: 15,
                maxPatientsPerDay: 20,
            });

        assert.equal(doctorConfigRes.status, 200, `doctor config failed: ${JSON.stringify(doctorConfigRes.body)}`);
        const doctorId = doctorConfigRes.body.doctor.id;
        assert.ok(doctorId, 'doctorId missing after schedule configuration');

        const nextDay = new Date();
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        nextDay.setUTCHours(0, 0, 0, 0);
        const date = nextDay.toISOString().split('T')[0];

        const slotStart = new Date(`${date}T10:00:00.000Z`);
        const slotEnd = new Date(`${date}T10:15:00.000Z`);

        const bookingRes = await patientAgent
            .post('/api/appointments/book')
            .set('Authorization', `Bearer ${patientAccessToken}`)
            .send({
                doctorId,
                date,
                slotStart: slotStart.toISOString(),
                slotEnd: slotEnd.toISOString(),
            });

        assert.equal(bookingRes.status, 201, `booking failed: ${JSON.stringify(bookingRes.body)}`);
        assert.equal(bookingRes.body.appointment.status, 'waiting');
        assert.equal(bookingRes.body.appointment.tokenNumber, 1);
        const appointmentId = bookingRes.body.appointment._id;

        const callNextRes = await doctorAgent
            .post('/api/queue/call-next')
            .set('Authorization', `Bearer ${doctorAccessToken}`)
            .set('X-Action-ID', `call-next-${unique}`)
            .send({ date });

        assert.equal(callNextRes.status, 200, `call-next failed: ${JSON.stringify(callNextRes.body)}`);
        assert.equal(callNextRes.body.success, true);
        assert.equal(callNextRes.body.currentToken, 1);
        assert.equal(callNextRes.body.appointment._id, appointmentId);

        const markCompletedRes = await doctorAgent
            .post('/api/queue/mark-completed')
            .set('Authorization', `Bearer ${doctorAccessToken}`)
            .set('X-Action-ID', `mark-completed-${unique}`)
            .send({ date });

        assert.equal(markCompletedRes.status, 200, `mark-completed failed: ${JSON.stringify(markCompletedRes.body)}`);
        assert.equal(markCompletedRes.body.success, true);
        assert.equal(markCompletedRes.body.completedToken, 1);

        const queueStateRes = await doctorAgent
            .get('/api/queue/current-state')
            .query({ date })
            .set('Authorization', `Bearer ${doctorAccessToken}`);

        assert.equal(queueStateRes.status, 200, `current-state failed: ${JSON.stringify(queueStateRes.body)}`);
        assert.equal(queueStateRes.body.counts.waiting, 0);
        assert.equal(queueStateRes.body.counts.inProgress, 0);
        assert.equal(queueStateRes.body.counts.completed, 1);

        const appointmentRes = await patientAgent
            .get(`/api/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${patientAccessToken}`);

        assert.equal(appointmentRes.status, 200, `appointment read failed: ${JSON.stringify(appointmentRes.body)}`);
        assert.equal(appointmentRes.body.data.status, 'completed');
    });
}
