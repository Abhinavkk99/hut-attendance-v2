-- Delete all attendance records first (foreign key constraint)
DELETE FROM attendance_records;

-- Delete all program enrollments (foreign key constraint)
DELETE FROM program_enrollments;

-- Delete all participants
DELETE FROM participants;

-- Reset sequences if needed
SELECT 'All participant data has been deleted successfully!' as status;
