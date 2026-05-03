import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../../lib/supabase';
import { Bug } from 'lucide-react';

export default function Debug() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .order('last_name');

      if (participantsError) {
        console.error('Participants error:', participantsError);
      } else {
        console.log('Participants:', participantsData);
        setParticipants(participantsData || []);
      }

      // Fetch all programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .order('name');

      if (programsError) {
        console.error('Programs error:', programsError);
      } else {
        console.log('Programs:', programsData);
        setPrograms(programsData || []);
      }

      // Fetch all enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('program_enrollments')
        .select('*');

      if (enrollmentsError) {
        console.error('Enrollments error:', enrollmentsError);
      } else {
        console.log('Enrollments:', enrollmentsData);
        setEnrollments(enrollmentsData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    return participant ? `${participant.first_name} ${participant.last_name}` : 'Unknown';
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    return program ? program.name : '⚠️ PROGRAM NOT FOUND';
  };

  return (
    <Layout title="Debug - Database Contents">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-yellow-50 border-4 border-yellow-400 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Bug size={32} className="text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">Database Debug Tool</h2>
          </div>
          <p className="text-lg text-gray-700">
            This page shows all raw data from your database tables.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-2xl font-bold text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Participants Table */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Participants ({participants.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">ID</th>
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">Email</th>
                      <th className="px-4 py-3 font-bold">Phone</th>
                      <th className="px-4 py-3 font-bold">All Columns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {participants.map(p => (
                      <tr key={p.id} className="hover:bg-blue-50">
                        <td className="px-4 py-3 text-xs font-mono">{p.id}</td>
                        <td className="px-4 py-3 font-semibold">{p.first_name} {p.last_name}</td>
                        <td className="px-4 py-3">{p.email}</td>
                        <td className="px-4 py-3">{p.phone}</td>
                        <td className="px-4 py-3">
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800 font-semibold">
                              View All Data
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(p, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Programs Table */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Programs ({programs.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">ID</th>
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">Days</th>
                      <th className="px-4 py-3 font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {programs.map(p => (
                      <tr key={p.id} className="hover:bg-green-50">
                        <td className="px-4 py-3 text-xs font-mono">{p.id}</td>
                        <td className="px-4 py-3 font-semibold">{p.name}</td>
                        <td className="px-4 py-3">{Array.isArray(p.days) ? p.days.join(', ') : p.days}</td>
                        <td className="px-4 py-3">{p.start_time} - {p.end_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enrollments Table */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-purple-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Program Enrollments ({enrollments.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">Enrollment ID</th>
                      <th className="px-4 py-3 font-bold">Participant</th>
                      <th className="px-4 py-3 font-bold">Program</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {enrollments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No enrollments found in database
                        </td>
                      </tr>
                    ) : (
                      enrollments.map(e => {
                        const programName = getProgramName(e.program_id);
                        const isOrphaned = programName.includes('NOT FOUND');
                        return (
                          <tr key={e.id} className={`hover:bg-purple-50 ${isOrphaned ? 'bg-red-50' : ''}`}>
                            <td className="px-4 py-3 text-xs font-mono">{e.id}</td>
                            <td className="px-4 py-3 font-semibold">{getParticipantName(e.participant_id)}</td>
                            <td className="px-4 py-3">
                              <div>{programName}</div>
                              <div className="text-xs text-gray-500 font-mono">{e.program_id}</div>
                            </td>
                            <td className="px-4 py-3">
                              {isOrphaned ? (
                                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                  ORPHANED
                                </span>
                              ) : (
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                  OK
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                <div>
                  <div className="text-3xl font-bold">{participants.length}</div>
                  <div className="opacity-90">Total Participants</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{programs.length}</div>
                  <div className="opacity-90">Total Programs</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{enrollments.length}</div>
                  <div className="opacity-90">Total Enrollments</div>
                </div>
              </div>
              
              {enrollments.some(e => !programs.find(p => p.id === e.program_id)) && (
                <div className="mt-6 bg-red-500 rounded-xl p-4">
                  <p className="font-bold text-xl">⚠️ Warning: Orphaned Enrollments Detected!</p>
                  <p className="mt-2">
                    Some enrollments reference programs that don't exist. These should be deleted.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}