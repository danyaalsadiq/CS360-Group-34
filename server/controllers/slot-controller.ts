import { Request, Response } from 'express';
import { SlotModel } from '../models/slot';
import { UserModel } from '../models';
import { format, parse, isAfter, isBefore, addDays } from 'date-fns';

// Get slots for a date range
export const getSlots = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // If user is therapist, only show their slots
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    let filter: any = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    if (userRole === 'therapist') {
      filter.therapist_id = userId;
    }
    
    const slots = await SlotModel.find(filter).sort({ date: 1, start_time: 1 });
    
    return res.status(200).json(slots);
  } catch (error: any) {
    console.error('Error getting slots:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Therapist marks availability
export const markAvailability = async (req: Request, res: Response) => {
  try {
    const { date, start_time, end_time } = req.body;
    
    if (!date || !start_time || !end_time) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }
    
    const userId = req.user?.id;
    const userName = req.user?.name;
    
    if (req.user?.role !== 'therapist') {
      return res.status(403).json({ message: 'Only therapists can mark availability' });
    }
    
    // Validate date is in the future
    const slotDate = new Date(date);
    const now = new Date();
    
    if (isBefore(slotDate, now) && !isAfter(slotDate, addDays(now, -1))) {
      return res.status(400).json({ message: 'Cannot mark availability for past dates' });
    }
    
    // Get day name (MON, TUE, etc.)
    const dayName = format(slotDate, 'EEE').toUpperCase();
    
    // Check if slot already exists
    const existingSlot = await SlotModel.findOne({
      date,
      start_time,
      therapist_id: userId
    });
    
    if (existingSlot) {
      return res.status(409).json({ message: 'You have already marked this slot' });
    }
    
    // Create new slot
    const newSlot = new SlotModel({
      date,
      day: dayName,
      start_time,
      end_time,
      therapist_id: userId,
      therapist_name: userName,
      status: 'available'
    });
    
    await newSlot.save();
    
    return res.status(201).json(newSlot);
  } catch (error: any) {
    console.error('Error marking availability:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Cancel a slot
export const cancelSlot = async (req: Request, res: Response) => {
  try {
    const slotId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    const slot = await SlotModel.findById(slotId);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    // Only the therapist who created the slot or an admin can cancel it
    if (userRole !== 'admin' && slot.therapist_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to cancel this slot' });
    }
    
    // Cannot cancel already booked appointments
    if (slot.status === 'booked' && userRole !== 'admin') {
      return res.status(400).json({ message: 'Cannot cancel a booked appointment' });
    }
    
    slot.status = 'cancelled';
    await slot.save();
    
    return res.status(200).json(slot);
  } catch (error: any) {
    console.error('Error cancelling slot:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Student requests an appointment
export const requestAppointment = async (req: Request, res: Response) => {
  try {
    const { slotId, therapistPreference } = req.body;
    
    if (!slotId) {
      return res.status(400).json({ message: 'Slot ID is required' });
    }
    
    const userId = req.user?.id;
    const userName = req.user?.name;
    
    if (req.user?.role !== 'student') {
      return res.status(403).json({ message: 'Only students can request appointments' });
    }
    
    // Find the slot
    const slot = await SlotModel.findById(slotId);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    // Check if slot is available
    if (slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot is not available' });
    }
    
    // Update slot with student information
    slot.student_id = userId;
    slot.student_name = userName;
    slot.status = 'booked';
    
    await slot.save();
    
    return res.status(200).json(slot);
  } catch (error: any) {
    console.error('Error requesting appointment:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Admin manually assigns a student to a slot
export const assignStudentToSlot = async (req: Request, res: Response) => {
  try {
    const { slotId, studentId } = req.body;
    
    if (!slotId || !studentId) {
      return res.status(400).json({ message: 'Slot ID and student ID are required' });
    }
    
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign students' });
    }
    
    // Find the slot
    const slot = await SlotModel.findById(slotId);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    // Check if slot is available
    if (slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot is not available' });
    }
    
    // Find the student
    const student = await UserModel.findOne({ _id: studentId, role: 'student' });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update slot with student information
    slot.student_id = studentId;
    slot.student_name = student.name;
    slot.status = 'booked';
    
    await slot.save();
    
    return res.status(200).json(slot);
  } catch (error: any) {
    console.error('Error assigning student to slot:', error);
    return res.status(500).json({ message: error.message });
  }
};