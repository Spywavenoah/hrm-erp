'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicForm } from '@/components/field-engine/dynamic-form';

export default function QualificationsPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Qualifications & Education</CardTitle>
      </CardHeader>
      <CardContent>
        <DynamicForm
          moduleKey="employee_qualifications"
          recordId={id}
          systemFieldDefs={[
            { key: 'highest_qualification', label: 'Highest Qualification', type: 'text', section: 'Education' },
            { key: 'institution', label: 'Institution', type: 'text', section: 'Education' },
            { key: 'graduation_year', label: 'Graduation Year', type: 'number', section: 'Education' },
            { key: 'field_of_study', label: 'Field of Study', type: 'text', section: 'Education' },
            { key: 'grade_class', label: 'Grade/Class', type: 'text', section: 'Education' },
          ]}
          submitLabel="Save Qualifications"
        />
      </CardContent>
    </Card>
  );
}
