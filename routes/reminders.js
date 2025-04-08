
// Function to send reminder email
const sendReminderEmail = async (appointment, studentEmail) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: 'Reminder: Your Upcoming Therapy Appointment',
      text: `Dear student,
  
  This is a reminder for your upcoming therapy appointment with therapist ${appointment.therapistId.username}.
  Date: ${appointment.date}
  Status: ${appointment.status}
  
  Please make sure to attend your appointment.
  
  Regards,
  CAPS Management System`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('Reminder email sent successfully');
    } catch (error) {
      console.log('Error sending email:', error);
    }
  };
  
  // Schedule the cron job to run every day at midnight (adjust timing as needed)
  cron.schedule('0 0 * * *', async () => {
    const currentTime = new Date();
    const reminderTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead
  
    try {
      // Find all appointments scheduled for tomorrow (24 hours from now)
      const appointments = await Appointment.find({
        date: { $gte: currentTime, $lt: reminderTime },
        status: 'scheduled',
      }).populate('studentId'); // Populate studentId to get the student's email
  
      // Send reminder emails for each appointment
      appointments.forEach((appointment) => {
        sendReminderEmail(appointment, appointment.studentId.email);
      });
    } catch (error) {
      console.error('Error checking appointments:', error);
    }
  });
  