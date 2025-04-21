import { Request, Response } from 'express';
import { SlotModel, ISlot } from '../../../../../../../../Muizz/Semester 6/Software Engineering/CAPS (2)/CAPS/server/models/slot';
import { TherapistSubmissionModel } from '../../../../../../../../Muizz/Semester 6/Software Engineering/CAPS (2)/CAPS/server/models/therapist-submission';
import { StudentRequestModel } from '../../../../../../../../Muizz/Semester 6/Software Engineering/CAPS (2)/CAPS/server/models/student-request';
import { UserModel } from '../../../../../../../../Muizz/Semester 6/Software Engineering/CAPS (2)/CAPS/server/models';

// Utility function to check if a slot overlaps with existing slots
const checkSlotOverlap = async (date: string, startTime: string, endTime: string, therapistId: string) => {
  const overlappingSlots = await SlotModel.find({
    date,
    therapist_id: therapistId,
    $or: [
      { start_time: { $lt: endTime, $gte: startTime } },
      { end_time: { $gt: startTime, $lte: endTime } },
      { start_time: { $lte: startTime }, end_time: { $gte: endTime } }
    ]
  });
  
  return overlappingSlots.length > 0;
};

// Get slots by date range
export const getSlots = async (req: Request, res: Response, isInternalCall: boolean = false) => {
  try {
    const { start_date, end_date, therapist_id, student_id, status } = req.query;
    
    // Base query
    const query: any = {};
    
    if (start_date && end_date) {
      query.date = { $gte: start_date, $lte: end_date };
    }
    
    // Role-based filtering - this is critical for proper privacy
    if (req.user) {
      // STUDENTS: only see their own booked/assigned slots
      if (req.user.role === 'student') {
        // For students, we need to be very specific about what slots they can see
        // They should ONLY see slots that:
        // 1. Are assigned to them (student_id matches)
        // 2. NOT slots that are just marked by therapists but not assigned to them
        query.student_id = req.user.id.toString();
        
      // THERAPISTS: only see their own marked slots and assigned appointments
      } else if (req.user.role === 'therapist') {
        // Only return slots created by this therapist
        query.therapist_id = req.user.id.toString();
        
      // ADMINS: see everything, so no additional filters
      } else if (req.user.role === 'admin') {
        // Admin can see everyone's slots
        // Apply optional filters if provided
        if (therapist_id) {
          query.therapist_id = therapist_id;
        }
        
        if (student_id) {
          query.student_id = student_id;
        }
      }
    }
    
    // Additional optional filters
    if (status) {
      query.status = status;
    }
    
    // Get slots with appropriate filtering
    const slots = await SlotModel.find(query).sort({ date: 1, start_time: 1 });
    console.log(`Returning ${slots.length} filtered slots based on user role ${req.user?.role}`);
    
    // For students, we need to check if they are on any waiting lists
    if (req.user?.role === 'student') {
      try {
        // Find student's waiting list requests
        const studentId = req.user.id.toString();
        const waitingRequests = await StudentRequestModel.find({
          student_id: studentId,
          status: 'waiting'
        });
        
        // Process waiting requests and create virtual slots
        const getTherapistName = async (therapistId: string): Promise<string> => {
          if (therapistId === 'unknown') {
            return 'Any Available Therapist';
          }
          
          try {
            const therapist = await UserModel.findById(therapistId);
            if (therapist && therapist.name) {
              return therapist.name;
            } else {
              return 'Preferred Therapist';
            }
          } catch (error) {
            console.error(`Error fetching therapist name for ID ${therapistId}:`, error);
            return 'Preferred Therapist';
          }
        };
        
        // Process all waiting requests and create virtual slots
        const waitlistedSlotsPromises = waitingRequests.map(async (request) => {
          // Only include requests with specific date/time (not just preferences)
          if (request.requested_date && request.requested_time) {
            // Check that the date falls within the requested range
            if (
              (!start_date || request.requested_date >= start_date.toString()) &&
              (!end_date || request.requested_date <= end_date.toString())
            ) {
              const therapistId = request.preferred_therapist_id || 'unknown';
              // Get the therapist name asynchronously
              const therapistName = await getTherapistName(therapistId);
              
              // Create a virtual slot to represent the waiting list item
              return {
                _id: request._id, // Use the request ID 
                date: request.requested_date,
                day: new Date(request.requested_date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                start_time: request.requested_time,
                end_time: incrementTimeByOneHour(request.requested_time),
                therapist_id: therapistId,
                therapist_name: therapistName,
                student_id: studentId,
                student_name: request.student_name,
                status: 'waitlisted',  // Special status just for UI display
                notes: 'Waiting for therapist to mark this slot as available',
                isWaitlisted: true,    // Flag to identify waitlisted slots
                created_at: request.created_at,
                updated_at: request.updated_at
              };
            }
          }
          return null;
        });
        
        // Resolve all promises and filter out any null values
        const resolvedWaitlistedSlots = await Promise.all(waitlistedSlotsPromises);
        const filteredWaitlistedSlots = resolvedWaitlistedSlots.filter(slot => slot !== null);
        const combinedSlots = [...slots, ...filteredWaitlistedSlots];
        
        // Sort by date and time
        combinedSlots.sort((a, b) => {
          if (a.date === b.date) {
            return a.start_time.localeCompare(b.start_time);
          }
          return a.date.localeCompare(b.date);
        });
        
        return res.status(200).json(combinedSlots);
      } catch (error) {
        console.error('Error fetching waitlist information:', error);
        // Continue with regular slots if there's an error with waitlist
        return res.status(200).json(slots);
      }
    } else {
      // For non-students, just return the regular slots
      return res.status(200).json(slots);
    }
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Failed to fetch slots' });
  }
};

// Helper function to increment time by one hour
function incrementTimeByOneHour(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  let newHours = hours + 1;
  
  // Handle 24-hour format
  if (newHours >= 24) {
    newHours = 0;
  }
  
  // Format back to HH:MM
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Get a single slot by ID
export const getSlotById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Slot ID is required' });
    }
    
    // First try to find a regular slot
    let slot = await SlotModel.findById(id);
    
    // If no regular slot is found, check if it's a waitlisted slot ID (student request)
    if (!slot) {
      console.log(`Regular slot with ID ${id} not found, checking student requests`);
      
      // Try to find a student request with this ID
      const studentRequest = await StudentRequestModel.findById(id);
      
      if (studentRequest) {
        // Get the therapist name from the UserModel based on the preferred_therapist_id
        let therapistName = 'Preferred Therapist';
        if (studentRequest.preferred_therapist_id) {
          const therapist = await UserModel.findById(studentRequest.preferred_therapist_id);
          if (therapist) {
            therapistName = therapist.name;
            console.log(`Found therapist name: ${therapistName} for ID: ${studentRequest.preferred_therapist_id}`);
          } else {
            console.log(`Therapist not found for ID: ${studentRequest.preferred_therapist_id}`);
          }
        }
        
        // Create a virtual slot object from the student request
        slot = {
          _id: studentRequest._id,
          date: studentRequest.requested_date,
          day: new Date(studentRequest.requested_date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          start_time: studentRequest.requested_time,
          end_time: incrementTimeByOneHour(studentRequest.requested_time),
          therapist_id: studentRequest.preferred_therapist_id || 'unknown',
          therapist_name: therapistName,
          student_id: studentRequest.student_id,
          student_name: studentRequest.student_name,
          status: 'waitlisted',
          notes: 'Waiting for therapist to mark this slot as available',
          isWaitlisted: true,
          created_at: studentRequest.created_at,
          updated_at: studentRequest.updated_at
        };
      }
      
      // If still not found, check the results from getSlots as a last resort
      if (!slot) {
        console.log(`Student request with ID ${id} not found, checking all slots`);
        
        // Create a temporary response object to capture the results
        const tempRes = {
          status: function(code) { return this; },
          json: function(data) { return data; }
        };
        
        // Call getSlots with the temporary response
        const allSlots = await getSlots(req, tempRes as Response, true);
        
        if (Array.isArray(allSlots)) {
          slot = allSlots.find(s => s._id?.toString() === id || s.id?.toString() === id);
        }
      }
      
      // If still not found, return 404
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }
    }
    
    console.log('Returning slot:', slot);
    res.status(200).json(slot);
  } catch (error) {
    console.error('Error fetching slot by ID:', error);
    res.status(500).json({ message: 'Failed to fetch slot' });
  }
};

// Mark slot as available (therapist or admin)
export const markAvailability = async (req: Request, res: Response) => {
  try {
    const { date, start_time, end_time, is_recurring, recurring_days, notes, therapist_id } = req.body;
    
    // Get therapist info - either from request body (admin) or authenticated user (therapist)
    let therapistId = req.user!.id.toString();
    let therapistName = req.user!.name;
    
    // If admin is setting availability for a specific therapist
    if (req.user!.role === 'admin' && therapist_id) {
      // Admin can set availability for any therapist
      therapistId = therapist_id;
      
      // Try to get the therapist's name
      try {
        const therapist = await import('../../../../../../../../Muizz/Semester 6/Software Engineering/CAPS (2)/CAPS/server/models').then(models => models.UserModel.findById(therapist_id));
        if (therapist) {
          therapistName = therapist.name;
        } else {
          therapistName = 'Unknown Therapist';
        }
      } catch (error) {
        console.error('Error fetching therapist info:', error);
        therapistName = 'Unknown Therapist';
      }
    }
    
    // Validation
    if (!date || !start_time || !end_time) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }
    
    // Check for overlapping slots
    const hasOverlap = await checkSlotOverlap(date, start_time, end_time, therapistId);
    if (hasOverlap) {
      return res.status(400).json({ message: 'This time slot overlaps with your existing availability' });
    }
    
    // Check if there are any students waiting for this specific slot
    const waitingStudents = await StudentRequestModel.find({
      preferred_therapist_id: therapistId,
      requested_date: date,
      requested_time: start_time,
      status: 'waiting',
      waiting_for_therapist: true
    }).sort({ created_at: 1 }); // Sort by creation time to prioritize first request
    
    // Create initial slot data
    const slotData = {
      date,
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      start_time,
      end_time,
      therapist_id: therapistId,
      therapist_name: therapistName,
      status: 'available',
      notes
    };
    
    // If there are waiting students, automatically assign the first one
    if (waitingStudents.length > 0) {
      const firstStudent = waitingStudents[0];
      
      // Update slot data to include student info
      slotData.student_id = firstStudent.student_id;
      slotData.student_name = firstStudent.student_name;
      slotData.status = 'booked';
      
      // Create the slot with the assigned student
      const slot = await SlotModel.create(slotData);
      
      // Update the student request
      firstStudent.status = 'assigned';
      firstStudent.assigned_slot_id = slot._id.toString();
      await firstStudent.save();
      
      // Handle recurring slots if requested
      if (is_recurring && recurring_days && recurring_days.length > 0) {
        // Create therapist submission for recurring slots
        const therapistSubmission = await TherapistSubmissionModel.create({
          therapist_id: therapistId,
          therapist_name: therapistName,
          date,
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          start_time,
          end_time,
          is_recurring: true,
          recurring_days,
          status: 'pending',
          notes
        });
        
        res.status(201).json({
          slot,
          recurring: therapistSubmission,
          assigned_student: {
            id: firstStudent.student_id,
            name: firstStudent.student_name
          },
          message: `This slot has been automatically assigned to a waiting student: ${firstStudent.student_name}`
        });
      } else {
        res.status(201).json({
          slot,
          assigned_student: {
            id: firstStudent.student_id,
            name: firstStudent.student_name
          },
          message: `This slot has been automatically assigned to a waiting student: ${firstStudent.student_name}`
        });
      }
    } else {
      // No waiting students, just create the slot as available
      const slot = await SlotModel.create(slotData);
      
      // Handle recurring slots if requested
      if (is_recurring && recurring_days && recurring_days.length > 0) {
        // Create therapist submission for recurring slots
        const therapistSubmission = await TherapistSubmissionModel.create({
          therapist_id: therapistId,
          therapist_name: therapistName,
          date,
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          start_time,
          end_time,
          is_recurring: true,
          recurring_days,
          status: 'pending',
          notes
        });
        
        res.status(201).json({
          slot,
          recurring: therapistSubmission
        });
      } else {
        res.status(201).json(slot);
      }
    }
  } catch (error) {
    console.error('Error marking availability:', error);
    res.status(500).json({ message: 'Failed to mark availability' });
  }
};

// Cancel a slot
export const cancelSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const slot = await SlotModel.findById(id);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    // Only the therapist who created the slot or an admin can cancel it
    if (req.user!.role !== 'admin' && slot.therapist_id !== req.user!.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to cancel this slot' });
    }
    
    // Update slot status to 'cancelled' and remove student assignment completely
    slot.status = 'cancelled';
    slot.notes = reason || slot.notes;
    
    // Clear student data to fully cancel the appointment
    slot.student_id = undefined;
    slot.student_name = undefined;
    
    await slot.save();
    
    res.status(200).json(slot);
  } catch (error) {
    console.error('Error cancelling slot:', error);
    res.status(500).json({ message: 'Failed to cancel slot' });
  }
};

// Student requests an appointment (student or admin on behalf of student)
export const requestAppointment = async (req: Request, res: Response) => {
  try {
    const { 
      preferred_days, 
      preferred_times, 
      preferred_therapist_id, 
      notes, 
      specific_date, 
      specific_time,
      student_id // Added for admin functionality
    } = req.body;
    
    // Get student info - either from request body (admin) or authenticated user (student)
    let studentId = req.user!.id.toString();
    let studentName = req.user!.name;
    
    // If admin is requesting on behalf of a student
    if (req.user!.role === 'admin' && student_id) {
      // Admin can request for any student
      studentId = student_id;
      
      // Try to get the student's name
      try {
        const student = await import('../../../../../../../../Muizz/Semester 6/Software Engineering/CAPS (2)/CAPS/server/models').then(models => models.UserModel.findById(student_id));
        if (student) {
          studentName = student.name;
        } else {
          studentName = 'Unknown Student';
        }
      } catch (error) {
        console.error('Error fetching student info:', error);
        studentName = 'Unknown Student';
      }
    }
    
    // Validation - either preferred days/times OR specific date/time must be provided
    if ((!preferred_days || !preferred_days.length || !preferred_times || !preferred_times.length) &&
        (!specific_date || !specific_time)) {
      return res.status(400).json({ message: 'Either preferred availability or specific date/time are required' });
    }
    
    // Create student request with additional info for waiting list if needed
    const studentRequest = await StudentRequestModel.create({
      student_id: studentId,
      student_name: studentName,
      preferred_days: preferred_days || [],
      preferred_times: preferred_times || [],
      preferred_therapist_id,
      status: 'pending',
      requested_date: specific_date,
      requested_time: specific_time,
      waiting_for_therapist: !!specific_date && !!specific_time,
      notes
    });
    
    // Try immediate matching algorithm
    let match_status = 'pending';
    let therapist_name = '';
    let date = '';
    let start_time = '';
    
    // CASE 1: Student is waiting for a specific slot (mark as 'waiting')
    if (specific_date && specific_time && preferred_therapist_id) {
      // Check if this specific slot already exists
      const existingSlot = await SlotModel.findOne({
        date: specific_date,
        start_time: specific_time,
        therapist_id: preferred_therapist_id
      });
      
      if (existingSlot) {
        // If slot exists but already booked, REJECT the request and inform the student
        if (existingSlot.status === 'booked' || existingSlot.student_id) {
          // Instead of adding to waitlist, mark it as explicitly rejected
          studentRequest.status = 'rejected';
          await studentRequest.save();
          
          return res.status(200).json({
            ...studentRequest.toObject(),
            match_status: 'rejected',
            message: 'This slot is already booked. Please try a different time or therapist.'
          });
        }
        
        // If slot exists and is available, book it immediately
        existingSlot.student_id = studentId;
        existingSlot.student_name = studentName;
        existingSlot.status = 'booked';
        await existingSlot.save();
        
        // Update request
        studentRequest.status = 'assigned';
        studentRequest.assigned_slot_id = existingSlot._id.toString();
        await studentRequest.save();
        
        return res.status(201).json({
          ...studentRequest.toObject(),
          match_status: 'matched',
          therapist_name: existingSlot.therapist_name,
          date: existingSlot.date,
          start_time: existingSlot.start_time
        });
      } else {
        // Slot doesn't exist yet - place student on waiting list
        studentRequest.status = 'waiting';
        await studentRequest.save();
        
        return res.status(201).json({
          ...studentRequest.toObject(),
          match_status: 'waiting',
          message: 'You have been placed on the waiting list for this slot. Once the therapist marks it as available, you may be assigned.'
        });
      }
    }
    
    // CASE 2: Process normal preferences-based matching
    // Find available slots that match student preferences
    const currentDate = new Date();
    
    // Check if there's an exact match for preferred therapist, day and time
    if (preferred_therapist_id) {
      // Try exact matches first
      for (const day of preferred_days) {
        for (const time of preferred_times) {
          // Convert day string (e.g., "MON") to an actual date in the current week
          const dayMap: { [key: string]: number } = { "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5 };
          const dayOfWeek = dayMap[day];
          
          if (!dayOfWeek) continue; // Skip invalid days
          
          // Calculate the date for this day of week
          const today = new Date();
          const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysToAdd);
          
          // Format the date as YYYY-MM-DD
          const targetDateStr = targetDate.toISOString().split('T')[0];
          
          // Find matching slot
          const matchingSlot = await SlotModel.findOne({
            therapist_id: preferred_therapist_id,
            date: targetDateStr,
            start_time: time,
            status: 'available'
          });
          
          if (matchingSlot) {
            // Book the slot with the student information
            matchingSlot.student_id = studentId;
            matchingSlot.student_name = studentName;
            matchingSlot.status = 'booked';
            await matchingSlot.save();
            
            // Update the request status
            studentRequest.status = 'assigned';
            studentRequest.assigned_slot_id = matchingSlot._id.toString();
            await studentRequest.save();
            
            match_status = 'matched';
            therapist_name = matchingSlot.therapist_name;
            date = matchingSlot.date;
            start_time = matchingSlot.start_time;
            
            break; // Exit the inner loop once we've found a match
          } else {
            // Slot doesn't exist, add student to waiting list for this date/time
            // But only update if we haven't found a match already and this is the preferred therapist
            if (match_status === 'pending') {
              studentRequest.status = 'waiting';
              studentRequest.requested_date = targetDateStr;
              studentRequest.requested_time = time;
              studentRequest.waiting_for_therapist = true;
              await studentRequest.save();
              
              match_status = 'waiting';
            }
          }
        }
        
        if (match_status === 'matched') break; // Exit the outer loop if we've found a match
      }
    }
    
    // If no exact match and not waiting, look for any available slot with matching criteria
    if (match_status === 'pending') {
      // Try to find an available slot with ANY therapist that matches preferred days/times
      for (const day of preferred_days) {
        for (const time of preferred_times) {
          // Calculate the date for this day of week (same logic as above)
          const dayMap: { [key: string]: number } = { "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5 };
          const dayOfWeek = dayMap[day];
          
          if (!dayOfWeek) continue;
          
          const today = new Date();
          const currentDayOfWeek = today.getDay();
          const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysToAdd);
          
          const targetDateStr = targetDate.toISOString().split('T')[0];
          
          // Find any available slot regardless of therapist
          const alternateSlot = await SlotModel.findOne({
            date: targetDateStr,
            start_time: time,
            status: 'available'
          });
          
          if (alternateSlot) {
            // Book the alternate slot
            alternateSlot.student_id = studentId;
            alternateSlot.student_name = studentName;
            alternateSlot.status = 'booked';
            await alternateSlot.save();
            
            // Update the request status
            studentRequest.status = 'assigned';
            studentRequest.assigned_slot_id = alternateSlot._id.toString();
            await studentRequest.save();
            
            match_status = 'alternate_offered';
            therapist_name = alternateSlot.therapist_name;
            date = alternateSlot.date;
            start_time = alternateSlot.start_time;
            
            break;
          }
        }
        
        if (match_status === 'alternate_offered') break;
      }
    }
    
    // Return the result with matching information
    res.status(201).json({
      ...studentRequest.toObject(),
      match_status,
      therapist_name,
      date,
      start_time
    });
  } catch (error) {
    console.error('Error requesting appointment:', error);
    res.status(500).json({ message: 'Failed to request appointment' });
  }
};

// Admin assigns a student to a slot
export const assignStudentToSlot = async (req: Request, res: Response) => {
  try {
    const { slot_id, student_id, student_name } = req.body;
    
    // Admin validation
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can assign slots' });
    }
    
    const slot = await SlotModel.findById(slot_id);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot is not available for booking' });
    }
    
    // Update slot with student info
    slot.student_id = student_id;
    slot.student_name = student_name;
    slot.status = 'booked';
    await slot.save();
    
    res.status(200).json(slot);
  } catch (error) {
    console.error('Error assigning student to slot:', error);
    res.status(500).json({ message: 'Failed to assign student to slot' });
  }
};

// Mark a slot as completed - for past slots
export const markSlotCompleted = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const slot = await SlotModel.findById(id);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    // Only therapists, student involved, or admins can mark as completed
    const isTherapist = req.user!.role === 'therapist' && slot.therapist_id === req.user!.id.toString();
    const isStudent = req.user!.role === 'student' && slot.student_id === req.user!.id.toString();
    const isAdmin = req.user!.role === 'admin';
    
    if (!isTherapist && !isStudent && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to mark this slot as completed' });
    }
    
    // Check if the slot is in the past
    const slotDate = new Date(slot.date);
    const slotTime = slot.start_time;
    const [hours, minutes] = slotTime.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    
    if (slotDate > now) {
      return res.status(400).json({ message: 'Cannot mark a future slot as completed' });
    }
    
    // Update slot status to 'completed'
    slot.status = 'completed';
    await slot.save();
    
    res.status(200).json(slot);
  } catch (error) {
    console.error('Error marking slot as completed:', error);
    res.status(500).json({ message: 'Failed to mark slot as completed' });
  }
};