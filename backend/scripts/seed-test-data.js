/**
 * Seed database with test data for development
 * Usage: node scripts/seed-test-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const DailyQueue = require('../models/DailyQueue');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qline';

async function main() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Appointment.deleteMany({});
        await DailyQueue.deleteMany({});
        console.log('✅ Data cleared');

        // Create test patients
        console.log('👨‍⚕️ Creating test patients...');
        const patients = await User.create([
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'patient',
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: 'password123',
                role: 'patient',
            },
            {
                name: 'Robert Johnson',
                email: 'robert@example.com',
                password: 'password123',
                role: 'patient',
            },
        ]);
        console.log(`✅ Created ${patients.length} test patients`);

        // Create test doctors
        console.log('👨‍⚕️ Creating test doctors...');
        const doctors = await User.create([
            {
                name: 'Dr. Sarah Williams',
                email: 'doctor.sarah@example.com',
                password: 'password123',
                role: 'doctor',
            },
            {
                name: 'Dr. Michael Chen',
                email: 'doctor.michael@example.com',
                password: 'password123',
                role: 'doctor',
            },
            {
                name: 'Dr. Emily Rodriguez',
                email: 'doctor.emily@example.com',
                password: 'password123',
                role: 'doctor',
            },
        ]);
        console.log(`✅ Created ${doctors.length} test doctors`);

        // Create doctor profiles
        console.log('📋 Creating doctor profiles...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const doctorProfiles = await Doctor.create([
            {
                userId: doctors[0]._id,
                department: 'General Medicine',
                specialization: 'Internal Medicine',
                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                workingHours: {
                    start: '09:00',
                    end: '17:00',
                },
                consultationDuration: 15, // minutes
                breakTimes: [],
                maxPatientsPerDay: 20,
                bufferTime: 5, // minutes
                bio: 'Senior General Medicine Practitioner with 10+ years experience',
            },
            {
                userId: doctors[1]._id,
                department: 'Cardiology',
                specialization: 'Cardiology',
                workingDays: ['Monday', 'Wednesday', 'Friday'],
                workingHours: {
                    start: '10:00',
                    end: '16:00',
                },
                consultationDuration: 20,
                breakTimes: [],
                maxPatientsPerDay: 15,
                bufferTime: 5,
                bio: 'Specialized Cardiologist with expertise in cardiac procedures',
            },
            {
                userId: doctors[2]._id,
                department: 'Pediatrics',
                specialization: 'Pediatrics',
                workingDays: ['Tuesday', 'Thursday', 'Saturday'],
                workingHours: {
                    start: '09:00',
                    end: '14:00',
                },
                consultationDuration: 10,
                breakTimes: [],
                maxPatientsPerDay: 25,
                bufferTime: 2,
                bio: 'Pediatrician specializing in child healthcare and development',
            },
        ]);
        console.log(`✅ Created ${doctorProfiles.length} doctor profiles`);

        // Create some sample appointments
        console.log('📅 Creating sample appointments...');
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Create slot times as Date objects
        const slot1Start = new Date(tomorrow);
        slot1Start.setHours(9, 0, 0, 0);
        const slot1End = new Date(tomorrow);
        slot1End.setHours(9, 15, 0, 0);

        const slot2Start = new Date(tomorrow);
        slot2Start.setHours(9, 15, 0, 0);
        const slot2End = new Date(tomorrow);
        slot2End.setHours(9, 30, 0, 0);

        const slot3Start = new Date(tomorrow);
        slot3Start.setHours(10, 0, 0, 0);
        const slot3End = new Date(tomorrow);
        slot3End.setHours(10, 20, 0, 0);

        const appointments = await Appointment.create([
            {
                patientId: patients[0]._id,
                doctorId: doctors[0]._id,
                date: tomorrow,
                slotStart: slot1Start,
                slotEnd: slot1End,
                status: 'booked',
                tokenNumber: 1,
            },
            {
                patientId: patients[1]._id,
                doctorId: doctors[0]._id,
                date: tomorrow,
                slotStart: slot2Start,
                slotEnd: slot2End,
                status: 'booked',
                tokenNumber: 2,
            },
            {
                patientId: patients[2]._id,
                doctorId: doctors[1]._id,
                date: tomorrow,
                slotStart: slot3Start,
                slotEnd: slot3End,
                status: 'booked',
                tokenNumber: 1,
            },
        ]);
        console.log(`✅ Created ${appointments.length} sample appointments`);

        console.log('\n');
        console.log('='.repeat(60));
        console.log('TEST ACCOUNTS CREATED');
        console.log('='.repeat(60));
        console.log('\n✅ PATIENTS:');
        patients.forEach((p) => {
            console.log(`   Email: ${p.email}`);
            console.log(`   Password: password123`);
            console.log(`   Name: ${p.name}\n`);
        });

        console.log('✅ DOCTORS:');
        doctors.forEach((d, idx) => {
            console.log(`   Email: ${d.email}`);
            console.log(`   Password: password123`);
            console.log(`   Name: ${d.name}`);
            console.log(`   Department: ${doctorProfiles[idx].department}\n`);
        });

        console.log('='.repeat(60));
        console.log('\n✅ Database seeding completed successfully!');
        console.log('\nYou can now login with any of the above accounts at:');
        console.log('http://localhost:3000/login');
        console.log('\n');
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

main();
