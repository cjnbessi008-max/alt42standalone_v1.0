interface Student {
  user_id: number;
  full_name: string;
  email: string;
  total_sessions: number;
  avg_stamina_score: string;
  total_questions_answered: number;
  overall_accuracy: string;
}

interface Props {
  students: Student[];
  onStudentSelect: (userId: number) => void;
  selectedStudent: any;
}

export default function StudentList({ students, onStudentSelect, selectedStudent }: Props) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">학생 목록</h2>

      <div className="space-y-2">
        {students.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            학생 데이터가 없습니다.
          </p>
        ) : (
          students.map((student) => {
            const staminaScore = parseFloat(student.avg_stamina_score);
            const isSelected = selectedStudent?.id === student.user_id;

            return (
              <button
                key={student.user_id}
                onClick={() => onStudentSelect(student.user_id)}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-primary-100 border-2 border-primary-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-900">
                      {student.full_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {student.email}
                    </div>
                  </div>

                  <div
                    className={`text-lg font-bold ${
                      staminaScore >= 75
                        ? 'text-green-600'
                        : staminaScore >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {staminaScore.toFixed(0)}
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>세션: {student.total_sessions}</span>
                  <span>정답률: {parseFloat(student.overall_accuracy).toFixed(0)}%</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
