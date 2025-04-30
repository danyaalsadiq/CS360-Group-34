import { Request, Response } from 'express';
import { UserModel } from '../models';
import { SlotModel } from '../models/slot';
import { StudentRequestModel } from '../models/student-request';
import { NotificationService } from '../services/notification-service';
import { sendNotificationToUser } from '../websocket';

/**
 * Admin endpoint to directly assign students to slots
 * This function handles multiple cases:
 * 1. Assigning student to an existing marked slot (has therapist, no student)
 * 2. Creating a new slot with both therapist and student (complete booking)
 * 3. Creating a slot with student only, waiting for therapist (student waitlisting)
 */
export const adminAssignStudent = async (req: Request, res: Response) => {
  try {
    const { 
      slotId,              // Optional - existing slot ID (case 1)
      date,                // Required for new slots (case 2 & 3)
      startTime,           // Required for new slots (case 2 & 3)
      endTime,             // Required for new slots (case 2 & 3)
      therapistId,         // Optional for waitlisted slots (case 3)
      therapistName,       // Optional (will be looked up if therapistId is provided)
      studentId,           // Required in all cases
      studentName,         // Optional (will be looked up)
      notes                // Optional notes for the slot
    } = req.body;
    
    // Verify admin permissions
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can perform this action' });
    }
    
    // Validate required parameters for all cases
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }
    
    // Find student if name wasn't provided
    let effectiveStudentName = studentName;
    if (!effectiveStudentName) {
      const student = await UserModel.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      effectiveStudentName = student.name;
    }
    
    // Create notification service
    const notificationService = new NotificationService();
    
    // CASE 1: Assign student to existing slot
    if (slotId) {
      const slot = await SlotModel.findById(slotId);
      
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }
      
      // Verify the slot is available
      if (slot.status !== 'available') {
        return res.status(400).json({ 
          message: `Slot is not available. Current status: ${slot.status}` 
        });
      }
      
      // Update the slot with student information
      slot.student_id = studentId;
      slot.student_name = effectiveStudentName;
      slot.status = 'booked';
      slot.notes = slot.notes 
        ? `${slot.notes}\nAdmin assigned: ${new Date().toLocaleString()}` 
        : `Admin assigned: ${new Date().toLocaleString()}`;
      
      if (notes) {
        slot.notes = slot.notes ? `${slot.notes}\n${notes}` : notes;
      }
      
      await slot.save();
      
      try {
        // Create notification for both the student and therapist
        const notifications = await notificationService.createNotificationForMultipleUsers(
          [studentId, slot.therapist_id],
          {
            title: 'Appointment Scheduled',
            message: `An administrator has scheduled an appointment on ${slot.date} at ${slot.start_time}.`,
            type: 'appointment_assigned',
            relatedId: slotId
          }
        );
        
        // Send real-time notifications via WebSocket
        if (notifications[0]) sendNotificationToUser(studentId, notifications[0]);
        if (notifications[1]) sendNotificationToUser(slot.therapist_id, notifications[1]);
      } catch (notifError) {
        console.error('Error creating notifications:', notifError);
        // Continue with the response even if notification creation fails
      }
      
      return res.status(200).json({
        message: 'Student successfully assigned to existing slot',
        slot
      });
    }
    
    // For new slots (CASE 2 & 3), we need date and time
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Date, start time, and end time are required for creating new slots' 
      });
    }
    
    // Format day of week
    const dateObj = new Date(date);
    const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dateObj.getDay()];
    
    // CASE 2: Create fully booked slot (has both therapist and student)
    if (therapistId) {
      // Find therapist if name wasn't provided
      let effectiveTherapistName = therapistName;
      if (!effectiveTherapistName) {
        const therapist = await UserModel.findById(therapistId);
        if (!therapist) {
          return res.status(404).json({ message: 'Therapist not found' });
        }
        effectiveTherapistName = therapist.name;
      }
      
      // Create a new slot with both therapist and student (fully booked)
      const newSlot = new SlotModel({
        date,
        day: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        therapist_id: therapistId,
        therapist_name: effectiveTherapistName,
        student_id: studentId,
        student_name: effectiveStudentName,
        status: 'booked',
        notes: notes || `Admin created: ${new Date().toLocaleString()}`,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await newSlot.save();
      
      try {
        // Create notification for both the student and therapist
        const notifications = await notificationService.createNotificationForMultipleUsers(
          [studentId, therapistId],
          {
            title: 'New Appointment Scheduled',
            message: `An administrator has created and scheduled an appointment on ${date} at ${startTime}.`,
            type: 'appointment_created',
            relatedId: newSlot._id.toString()
          }
        );
        
        // Send real-time notifications via WebSocket
        if (notifications[0]) sendNotificationToUser(studentId, notifications[0]);
        if (notifications[1]) sendNotificationToUser(therapistId, notifications[1]);
      } catch (notifError) {
        console.error('Error creating notifications:', notifError);
        // Continue with the response even if notification creation fails
      }
      
      return res.status(201).json({
        message: 'New slot created and assigned to both therapist and student',
        slot: newSlot
      });
    }
    
    // CASE 3: Create waitlisted slot (student waiting for therapist)
    // Create a student request for a preferred therapist in the future
    const studentRequest = new StudentRequestModel({
      student_id: studentId,
      student_name: effectiveStudentName,
      preferred_therapist_id: null, // No specific therapist preference
      preferred_therapist_name: null,
      preferred_date: date,
      preferred_time: startTime,
      status: 'waiting',
      waiting_for_therapist: true,
      notes: notes || `Admin waitlisted for ${date} at ${startTime}`,
      created_at: new Date()
    });
    
    await studentRequest.save();
    
    try {
      // Create notification just for the student
      const notification = await notificationService.createNotification({
        userId: studentId,
        title: 'Waitlisted for Appointment',
        message: `An administrator has added you to the waitlist for an appointment on ${date} at ${startTime}. You'll be notified when a therapist becomes available.`,
        type: 'waitlist_added',
        relatedId: studentRequest._id.toString(),
        isRead: false,
        createdAt: new Date()
      });
      
      // Send real-time notification via WebSocket
      sendNotificationToUser(studentId, notification);
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    return res.status(201).json({
      message: 'Student successfully waitlisted for future therapist availability',
      request: studentRequest
    });
  } catch (error: any) {
    console.error('Error in admin assign student:', error);
    return res.status(500).json({ message: error.message || 'An error occurred while assigning student to slot' });
  }
};