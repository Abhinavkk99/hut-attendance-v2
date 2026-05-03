import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, FileText, BookOpen, Clock, ChevronDown, ChevronUp, Users, Edit, Trash2, UserX, RotateCcw, Plus } from 'lucide-react';
import { supabase, Participant, Program, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface EnrolledProgram extends Program {
  enrolled_at?: string;
  attendance_count?: number;
  total_sessions?: number;
  enrollment_notes?: string;
  enrollment_data?: any; // Program-specific enrollment data
}

export default function ParticipantProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState<EnrolledProgram[]>([]);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);
  const [showUnenrollAllConfirm, setShowUnenrollAllConfirm] = useState(false);
  const [programToUnenroll, setProgramToUnenroll] = useState<EnrolledProgram | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchParticipant();
    }
  }, [id]);

  const fetchParticipant = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }

    try {
      // Fetch participant data
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single();

      if (participantError) throw participantError;
      setParticipant(participantData);

      // Fetch enrolled programs
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('program_enrollments')
        .select(`
          enrolled_at,
          programs (
            id,
            name,
            description,
            days,
            start_time,
            end_time,
            capacity
          )
        `)
        .eq('participant_id', id);

      if (enrollmentsError) throw enrollmentsError;

      // Get program-specific data from participant's program_specific_data JSON field
      // Parse the JSON string from database
      let programSpecificData = {};
      try {
        programSpecificData = typeof participantData.program_specific_data === 'string'
          ? JSON.parse(participantData.program_specific_data)
          : (participantData.program_specific_data || {});
      } catch (e) {
        console.error('Error parsing program_specific_data:', e);
        programSpecificData = {};
      }

      // Map program names to their slug/ID used in the registration form
      // Note: These must match EXACTLY the program names in the database
      const programNameToSlug: Record<string, string> = {
        'Outdoor Playgroup': 'outdoor-playgroup',
        'Out & About': 'out-and-about',
        'Dungeons & Dragons': 'dungeons-dragons',
        'Workshop (Companion Animal)': 'workshop-companion-animal',
        'Strength & Balance (Stirling)': 'strength-balance-stirling',
        'Music Makers': 'music-makers',
        'Chi Kung': 'chi-kung',
        'Homework Club': 'homework-club',
        'Community Fun Fitness': 'community-fun-fitness',
        "Men's Moves": 'mens-moves',  // Note the apostrophe in Men's
        'Community Shed': 'community-shed',
        'Walking Group': 'walking-group'
      };

      // Transform the data to flatten the programs object and get attendance stats
      const programs = await Promise.all(
        (enrollmentsData || []).map(async (enrollment: any) => {
          const programId = enrollment.programs?.id;
          const programName = enrollment.programs?.name;

          // Fetch attendance records for this program
          let attendance_count = 0;
          if (programId) {
            const { data: attendanceData } = await supabase
              .from('attendance_records')
              .select('status')
              .eq('program_id', programId)
              .eq('participant_id', id)
              .eq('status', 'present');

            attendance_count = attendanceData?.length || 0;
          }

          // Get program-specific enrollment data if it exists
          // The data is stored with program slug as key, not the UUID
          const programSlug = programNameToSlug[programName] || '';
          const enrollmentData = programSpecificData[programSlug] || {};

          return {
            ...enrollment.programs,
            enrolled_at: enrollment.enrolled_at,
            attendance_count,
            enrollment_data: enrollmentData
          };
        })
      );

      setEnrolledPrograms(programs);
    } catch (err) {
      console.error('Error fetching participant:', err);
      setError('Failed to load participant profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleProgramExpansion = (programId: string | undefined) => {
    if (!programId) return;

    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!id || !isSupabaseConfigured) return;

    setDeleting(true);
    try {
      // First delete all program enrollments
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .delete()
        .eq('participant_id', id);

      if (enrollmentError) throw enrollmentError;

      // Delete attendance records
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('participant_id', id);

      if (attendanceError) throw attendanceError;

      // Finally delete the participant
      const { error: participantError } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (participantError) throw participantError;

      // Navigate back to search page after successful deletion
      navigate('/search', { replace: true });
    } catch (err) {
      console.error('Error deleting participant:', err);
      setError('Failed to delete participant. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/participant/${id}/edit`);
  };

  const handleUnenrollFromProgram = async () => {
    if (!id || !programToUnenroll?.id || !isSupabaseConfigured) return;
    setUnenrolling(true);
    try {
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .delete()
        .eq('participant_id', id)
        .eq('program_id', programToUnenroll.id);
      if (enrollmentError) throw enrollmentError;
      await fetchParticipant();
      setShowUnenrollConfirm(false);
      setProgramToUnenroll(null);
    } catch (err) {
      console.error('Error unenrolling from program:', err);
      setError('Failed to unenroll from program. Please try again.');
      setShowUnenrollConfirm(false);
    } finally {
      setUnenrolling(false);
    }
  };

  const handleUnenrollFromAllPrograms = async () => {
    if (!id || !isSupabaseConfigured) return;
    setUnenrolling(true);
    try {
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .delete()
        .eq('participant_id', id);
      if (enrollmentError) throw enrollmentError;
      await fetchParticipant();
      setShowUnenrollAllConfirm(false);
    } catch (err) {
      console.error('Error making profile inactive:', err);
      setError('Failed to make profile inactive. Please try again.');
      setShowUnenrollAllConfirm(false);
    } finally {
      setUnenrolling(false);
    }
  };

  const handleReactivateProfile = () => {
    navigate('/add-to-program');
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-orange-600 mx-auto mb-6"></div>
            <p className="text-2xl text-gray-600 font-semibold">Loading participant profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !participant) {
    return (
      <Layout title="Error">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border-4 border-red-400 text-red-800 px-8 py-6 rounded-xl mb-8">
            <p className="text-xl font-bold">{error || 'Participant not found'}</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-3 px-8 py-5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-xl font-bold transition-all"
          >
            <ArrowLeft size={24} />
            Back to Search
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Participant Profile">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="mb-6 rounded-xl border border-zinc-800/80 bg-[#111113] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <User size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {participant.first_name} {participant.last_name}
              </h2>
              <p className="text-xs text-zinc-500">Participant profile</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-zinc-800">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Mail className="text-blue-400" size={32} />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Email</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">{participant.email || 'Not provided'}</p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Phone</p>
              </div>
              <p className="text-xl text-gray-900 ml-9 font-semibold">{participant.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-zinc-800">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <User className="text-blue-400" size={32} />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <User className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Gender</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">{participant.gender || 'Not provided'}</p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Date of Birth</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">
                {participant.date_of_birth
                  ? new Date(participant.date_of_birth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not provided'}
              </p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-xl md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Address</p>
              </div>
              <div className="text-xl text-gray-900 ml-9">
                <p>{participant.address_line1 || 'Not provided'}</p>
                {participant.address_line2 && <p>{participant.address_line2}</p>}
                <p>
                  {participant.township || ''}{participant.township_other ? ` (${participant.township_other})` : ''}
                  {participant.post_code ? `, ${participant.post_code}` : ''}
                </p>
                {participant.council_region && <p>{participant.council_region}</p>}
              </div>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Registration Date</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">
                {participant.created_at
                  ? new Date(participant.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not available'}
              </p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Participant ID</p>
              </div>
              <p className="text-base text-gray-700 ml-9 font-mono break-all">{participant.id}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-zinc-800">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Phone className="text-blue-400" size={32} />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <User className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Contact Name</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">{participant.emergency_contact_name || 'Not provided'}</p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="text-blue-400" size={24} />
                <p className="text-lg font-bold text-gray-700">Contact Phone</p>
              </div>
              <p className="text-xl text-gray-900 ml-9 font-semibold">{participant.emergency_contact_phone || 'Not provided'}</p>
            </div>
            {participant.emergency_contact_relationship && (
              <div className="bg-zinc-900/40 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-blue-400" size={24} />
                  <p className="text-lg font-bold text-gray-700">Relationship</p>
                </div>
                <p className="text-xl text-gray-900 ml-9">{participant.emergency_contact_relationship}</p>
              </div>
            )}
            {participant.emergency_contact_address && (
              <div className="bg-zinc-900/40 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="text-blue-400" size={24} />
                  <p className="text-lg font-bold text-gray-700">Contact Address</p>
                </div>
                <p className="text-xl text-gray-900 ml-9">{participant.emergency_contact_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cultural Background */}
        {(participant.identify_aboriginal_tsi || participant.country_of_birth || participant.speak_other_language || participant.cultural_identity || participant.lgbti_community) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-yellow-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="text-yellow-600" size={32} />
              Cultural Background
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {participant.identify_aboriginal_tsi && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Aboriginal or Torres Strait Islander</p>
                  <p className="text-xl text-gray-900">{participant.identify_aboriginal_tsi}</p>
                </div>
              )}
              {participant.country_of_birth && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Country of Birth</p>
                  <p className="text-xl text-gray-900">{participant.country_of_birth}</p>
                </div>
              )}
              {participant.speak_other_language && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Speaks Other Language</p>
                  <p className="text-xl text-gray-900">{participant.speak_other_language}</p>
                  {participant.other_language_details && (
                    <p className="text-base text-gray-700 mt-2">Language(s): {participant.other_language_details}</p>
                  )}
                </div>
              )}
              {participant.cultural_identity && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Cultural Identity</p>
                  <p className="text-xl text-gray-900">{participant.cultural_identity}</p>
                  {participant.cultural_identity_details && (
                    <p className="text-base text-gray-700 mt-2">{participant.cultural_identity_details}</p>
                  )}
                </div>
              )}
              {participant.lgbti_community && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">LGBTI+ Community Member</p>
                  <p className="text-xl text-gray-900">{participant.lgbti_community}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Communication Preferences */}
        {(participant.receive_newsletter !== null || participant.receive_course_notifications !== null) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-indigo-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Mail className="text-indigo-600" size={32} />
              Communication Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 p-6 rounded-xl">
                <p className="text-lg font-bold text-gray-700 mb-2">Newsletter</p>
                <p className="text-xl text-gray-900">
                  {participant.receive_newsletter ? '✓ Subscribed' : '✗ Not subscribed'}
                </p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-xl">
                <p className="text-lg font-bold text-gray-700 mb-2">Program Notifications</p>
                <p className="text-xl text-gray-900">
                  {participant.receive_course_notifications ? '✓ Subscribed' : '✗ Not subscribed'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Referral Sources */}
        {(() => {
          let referralSources: string[] = [];
          try {
            referralSources = typeof participant.referral_sources === 'string'
              ? JSON.parse(participant.referral_sources)
              : (participant.referral_sources || []);
          } catch (e) {
            referralSources = [];
          }

          if (referralSources.length > 0) {
            return (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FileText className="text-purple-600" size={32} />
                  How They Found Us
                </h3>
                <div className="bg-purple-50 p-6 rounded-xl">
                  <div className="flex flex-wrap gap-3">
                    {referralSources.map((source, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-purple-200 text-purple-900 rounded-full text-base font-semibold"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Photo Consent */}
        {(() => {
          let photoConsent: any = {};
          try {
            photoConsent = typeof participant.photo_consent === 'string'
              ? JSON.parse(participant.photo_consent)
              : (participant.photo_consent || {});
          } catch (e) {
            photoConsent = {};
          }

          const hasAnyConsent = Object.values(photoConsent).some(v => v === true);

          if (hasAnyConsent) {
            return (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-pink-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FileText className="text-pink-600" size={32} />
                  Photo Consent
                </h3>
                <div className="bg-pink-50 p-6 rounded-xl">
                  <p className="text-base text-gray-700 mb-4">Permission granted for use in:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {photoConsent.website && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Website</span>
                      </div>
                    )}
                    {photoConsent.socialMedia && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Social Media</span>
                      </div>
                    )}
                    {photoConsent.annualReport && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Annual Report</span>
                      </div>
                    )}
                    {photoConsent.brochures && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Brochures & Flyers</span>
                      </div>
                    )}
                    {photoConsent.localMedia && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Local Media</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Additional Notes */}
        {participant.additional_requirements && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-zinc-800">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="text-blue-400" size={32} />
              Additional Requirements
            </h3>
            <div className="bg-zinc-900/40 p-6 rounded-xl">
              <p className="text-lg text-gray-800 whitespace-pre-wrap">{participant.additional_requirements}</p>
            </div>
          </div>
        )}

        {/* Program-Specific Registration Responses */}
        {(() => {
          let programSpecificData: any = {};
          try {
            programSpecificData = typeof participant.program_specific_data === 'string'
              ? JSON.parse(participant.program_specific_data)
              : (participant.program_specific_data || {});
          } catch (e) {
            console.error('Error parsing program_specific_data:', e);
            programSpecificData = {};
          }

          const fitnessData = programSpecificData.fitness || {};

          // Handle both old format (single child object) and new format (multiple children array)
          let childrenArray = [];
          if (programSpecificData.allChildren && programSpecificData.allChildren.length > 0) {
            // New format with multiple children
            childrenArray = programSpecificData.allChildren;
          } else {
            // Old format (single child)
            const childrenDataRaw = programSpecificData.children || {};
            childrenArray = Object.keys(childrenDataRaw).length > 0 ? [childrenDataRaw] : [];
          }

          const hasChildrenData = childrenArray.length > 0;
          const hasFitnessData = Object.keys(fitnessData).length > 0;

          if (!hasChildrenData && !hasFitnessData) return null;

          return (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-purple-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FileText className="text-purple-600" size={32} />
                Program-Specific Registration Information
              </h3>

              <div className="space-y-6">
                {/* Children's Programs Data */}
                {hasChildrenData && (
                  <div className="space-y-4">
                    {childrenArray.map((childrenData, childIndex) => (
                      <div key={childIndex} className="bg-purple-50 p-6 rounded-xl border-2 border-purple-300">
                        <h4 className="text-xl font-bold text-purple-900 mb-4">
                          Children's Programs Information {childrenArray.length > 1 ? `- Child ${childIndex + 1}` : ''}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {childrenData.childGivenName && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Given Name</p>
                          <p className="text-base text-gray-900">{childrenData.childGivenName}</p>
                        </div>
                      )}
                      {childrenData.childFamilyName && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Family Name</p>
                          <p className="text-base text-gray-900">{childrenData.childFamilyName}</p>
                        </div>
                      )}
                      {childrenData.childGender && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Gender</p>
                          <p className="text-base text-gray-900">{childrenData.childGender}</p>
                        </div>
                      )}
                      {childrenData.childDOB && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Date of Birth</p>
                          <p className="text-base text-gray-900">
                            {new Date(childrenData.childDOB).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {childrenData.childAboriginalTSI && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Aboriginal or Torres Strait Islander</p>
                          <p className="text-base text-gray-900">{childrenData.childAboriginalTSI}</p>
                        </div>
                      )}
                      {childrenData.schoolAttending && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">School Attending</p>
                          <p className="text-base text-gray-900">{childrenData.schoolAttending}</p>
                        </div>
                      )}
                      {childrenData.yearLevel && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Year Level</p>
                          <p className="text-base text-gray-900">{childrenData.yearLevel}</p>
                        </div>
                      )}
                      {childrenData.childPhotoConsent && (
                        <div className="bg-white p-4 rounded-lg md:col-span-2">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Photo Consent</p>
                          <p className="text-base text-gray-900 whitespace-pre-wrap">{childrenData.childPhotoConsent}</p>
                        </div>
                      )}
                    </div>

                    {/* Authorized Persons */}
                    {(childrenData.authorisedPerson1Name || childrenData.authorisedPerson2Name) && (
                      <div className="mt-4 bg-yellow-100 p-4 rounded-lg">
                        <p className="text-sm font-bold text-yellow-900 mb-3">Authorized to Collect Child</p>
                        <div className="space-y-3">
                          {childrenData.authorisedPerson1Name && (
                            <div className="bg-white p-3 rounded">
                              <p className="text-base font-semibold text-gray-900">{childrenData.authorisedPerson1Name}</p>
                              {childrenData.authorisedPerson1Phone && (
                                <p className="text-sm text-gray-700">Phone: {childrenData.authorisedPerson1Phone}</p>
                              )}
                            </div>
                          )}
                          {childrenData.authorisedPerson2Name && (
                            <div className="bg-white p-3 rounded">
                              <p className="text-base font-semibold text-gray-900">{childrenData.authorisedPerson2Name}</p>
                              {childrenData.authorisedPerson2Phone && (
                                <p className="text-sm text-gray-700">Phone: {childrenData.authorisedPerson2Phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {childrenData.custodyIssues && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Custody Issues</p>
                          <p className="text-base text-gray-900">{childrenData.custodyIssues}</p>
                          {childrenData.custodyIssuesDetails && (
                            <p className="text-sm text-gray-700 mt-2">{childrenData.custodyIssuesDetails}</p>
                          )}
                        </div>
                      )}
                      {childrenData.ownWayHomePermission && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Permission to Make Own Way Home</p>
                          <p className="text-base text-gray-900">{childrenData.ownWayHomePermission}</p>
                          {childrenData.ownWayHomeDetails && (
                            <p className="text-sm text-gray-700 mt-2">{childrenData.ownWayHomeDetails}</p>
                          )}
                        </div>
                      )}
                    </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fitness Programs Data */}
                {hasFitnessData && (
                  <div className="bg-zinc-900/40 p-6 rounded-xl border-2 border-orange-300">
                    <h4 className="text-xl font-bold text-orange-900 mb-4">Fitness & Wellbeing Programs - Health Information</h4>
                    <div className="space-y-4">
                      {fitnessData.healthConditions && fitnessData.healthConditions.length > 0 && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-2">Health Conditions</p>
                          <div className="flex flex-wrap gap-2">
                            {fitnessData.healthConditions.map((condition: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-orange-200 text-orange-900 rounded-full text-sm font-semibold"
                              >
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {fitnessData.regularExercise && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Regular Exercise Level</p>
                          <p className="text-base text-gray-900">{fitnessData.regularExercise}</p>
                        </div>
                      )}
                      {fitnessData.medicalProcedures && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Medical Procedures (Last 12 Months)</p>
                          <p className="text-base text-gray-900 whitespace-pre-wrap">{fitnessData.medicalProcedures}</p>
                        </div>
                      )}
                      {fitnessData.medicalTreatmentAcknowledged && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Medical Treatment Acknowledgement</p>
                          <p className="text-base text-gray-900">
                            ✓ Acknowledged - {fitnessData.medicalTreatmentAcknowledgedDate
                              ? new Date(fitnessData.medicalTreatmentAcknowledgedDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Date not recorded'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Enrolled Programs */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-zinc-800">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <BookOpen className="text-blue-400" size={32} />
            Enrolled Programs
          </h3>

          {enrolledPrograms.length === 0 ? (
            <div className="bg-zinc-900/40 p-8 rounded-xl text-center">
              <BookOpen className="mx-auto mb-4 text-orange-400" size={48} />
              <p className="text-xl text-gray-700 font-semibold">Not enrolled in any programs yet</p>
              <p className="text-lg text-gray-600 mt-2">Click "Add to Program" below to enroll this participant</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrolledPrograms.map((program) => {
                const isExpanded = expandedPrograms.has(program.id || '');
                return (
                  <div
                    key={program.id}
                    className="bg-zinc-900/40 rounded-xl border-2 border-zinc-800 hover:border-orange-400 transition-all overflow-hidden"
                  >
                    {/* Program Header - Always Visible */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => toggleProgramExpansion(program.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-bold text-gray-900">{program.name}</h4>
                            <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-semibold">
                              {program.attendance_count || 0} sessions attended
                            </span>
                          </div>

                          {program.description && (
                            <p className="text-base text-gray-600 mb-3">{program.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-base text-gray-700">
                            <div className="flex items-center gap-2">
                              <Clock className="text-blue-400" size={18} />
                              <span className="font-semibold">{program.start_time} - {program.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="text-blue-400" size={18} />
                              <span>{program.days && program.days.length > 0 ? program.days.join(', ') : 'No days'}</span>
                            </div>
                            {program.capacity && (
                              <div className="flex items-center gap-2">
                                <Users className="text-blue-400" size={18} />
                                <span>Capacity: {program.capacity}</span>
                              </div>
                            )}
                            {program.enrolled_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="text-blue-400" size={18} />
                                <span className="text-sm">
                                  Enrolled: {new Date(program.enrolled_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProgramToUnenroll(program);
                              setShowUnenrollConfirm(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/15"
                            aria-label={`Unenroll from ${program.name}`}
                          >
                            <UserX size={13} /> Unenroll
                          </button>
                          <button
                            className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProgramExpansion(program.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="text-blue-400" size={24} />
                            ) : (
                              <ChevronDown className="text-blue-400" size={24} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t-2 border-zinc-800 pt-4 space-y-4">
                        {/* Program Details */}
                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="text-blue-600" size={22} />
                            <h5 className="font-bold text-blue-900 text-lg">Program Details</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {program.description && (
                              <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                                <span className="text-sm font-bold text-blue-700 mb-1 block">Description</span>
                                <span className="text-base text-gray-900">{program.description}</span>
                              </div>
                            )}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <span className="text-sm font-bold text-blue-700 mb-1 block">Schedule</span>
                              <span className="text-base text-gray-900">
                                {program.days && program.days.length > 0 ? program.days.join(', ') : 'Not specified'}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <span className="text-sm font-bold text-blue-700 mb-1 block">Time</span>
                              <span className="text-base text-gray-900">
                                {program.start_time} - {program.end_time}
                              </span>
                            </div>
                            {program.capacity && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-blue-700 mb-1 block">Capacity</span>
                                <span className="text-base text-gray-900">{program.capacity} participants</span>
                              </div>
                            )}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <span className="text-sm font-bold text-blue-700 mb-1 block">Attendance</span>
                              <span className="text-base text-gray-900">{program.attendance_count || 0} sessions attended</span>
                            </div>
                            {program.enrolled_at && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-blue-700 mb-1 block">Enrollment Date</span>
                                <span className="text-base text-gray-900">
                                  {new Date(program.enrolled_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Program-Specific Registration Information */}
                        {program.enrollment_data && Object.keys(program.enrollment_data).length > 0 ? (
                          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <FileText className="text-purple-600" size={22} />
                              <h5 className="font-bold text-purple-900 text-lg">Program-Specific Registration Data</h5>
                            </div>
                            <div className="space-y-3">
                              {Object.entries(program.enrollment_data).map(([key, value]: [string, any]) => {
                                // Format the key from camelCase/snake_case to readable text
                                const formattedKey = key
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/_/g, ' ')
                                  .replace(/^./, (str) => str.toUpperCase())
                                  .trim();

                                // Handle different value types
                                let displayValue = value;
                                if (typeof value === 'boolean') {
                                  displayValue = value ? 'Yes' : 'No';
                                } else if (Array.isArray(value)) {
                                  displayValue = value.join(', ');
                                } else if (typeof value === 'object' && value !== null) {
                                  displayValue = JSON.stringify(value, null, 2);
                                } else if (value === null || value === undefined || value === '') {
                                  displayValue = 'Not provided';
                                }

                                return (
                                  <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-purple-700 mb-1">{formattedKey}</span>
                                      <span className="text-base text-gray-900 whitespace-pre-wrap break-words">
                                        {displayValue}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-zinc-900/40 p-6 rounded-lg text-center">
                            <FileText className="mx-auto mb-3 text-orange-400" size={40} />
                            <p className="text-lg text-gray-700 font-semibold">No program-specific registration data</p>
                            <p className="text-base text-gray-600 mt-2">This participant was enrolled without additional program-specific information</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center justify-center gap-3 px-8 py-5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft size={24} />
            Back to Search
          </button>

          {user?.role === 'admin' && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-indigo-500"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}

          {enrolledPrograms.length > 0 ? (
            <>
              <button
                onClick={() => navigate('/add-to-program')}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <Plus size={14} /> Add to program
              </button>
              <button
                onClick={() => setShowUnenrollAllConfirm(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              >
                <UserX size={14} /> Make inactive
              </button>
            </>
          ) : (
            <button
              onClick={handleReactivateProfile}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-green-500"
            >
              <RotateCcw size={14} /> Reactivate profile
            </button>
          )}
        </div>

        {/* Unenroll From Single Program Modal */}
        {showUnenrollConfirm && programToUnenroll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 ring-1 ring-red-500/30">
                  <UserX size={18} className="text-red-300" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">Unenroll from program</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Unenroll <span className="font-semibold text-zinc-200">{participant?.first_name} {participant?.last_name}</span> from <span className="font-semibold text-zinc-200">{programToUnenroll.name}</span>?
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Their attendance history is kept. They can be re-enrolled later.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setShowUnenrollConfirm(false);
                    setProgramToUnenroll(null);
                  }}
                  disabled={unenrolling}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnenrollFromProgram}
                  disabled={unenrolling}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 hover:from-red-400 hover:to-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unenrolling ? 'Unenrolling…' : 'Unenroll'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Make Inactive (unenroll from all) Modal */}
        {showUnenrollAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111113] p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30">
                  <UserX size={18} className="text-amber-300" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">Make profile inactive</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Unenroll <span className="font-semibold text-zinc-200">{participant?.first_name} {participant?.last_name}</span> from all programs?
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                The participant record and attendance history are preserved. The profile becomes inactive and can be reactivated later by re-enrolling in a program.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setShowUnenrollAllConfirm(false)}
                  disabled={unenrolling}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnenrollFromAllPrograms}
                  disabled={unenrolling}
                  className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unenrolling ? 'Working…' : 'Make inactive'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-red-400">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Confirm Delete</h3>
              </div>

              <p className="text-lg text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-bold">{participant?.first_name} {participant?.last_name}</span>?
              </p>

              <p className="text-base text-red-600 font-semibold mb-6">
                This action cannot be undone. All enrollment and attendance records will be permanently deleted.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-400 hover:to-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
