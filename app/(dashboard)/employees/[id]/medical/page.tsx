'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicForm } from '@/components/field-engine/dynamic-form';

export default function MedicalPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Medical Records</CardTitle>
      </CardHeader>
      <CardContent>
        <DynamicForm
          moduleKey="employee_medical"
          recordId={id}
          systemFieldDefs={[
            { key: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], section: 'Medical Information' },
            { key: 'genotype', label: 'Genotype', type: 'select', options: ['AA', 'AS', 'SS', 'AC'], section: 'Medical Information' },
            { key: 'allergies', label: 'Known Allergies', type: 'text', section: 'Medical Information' },
            { key: 'chronic_conditions', label: 'Chronic Conditions', type: 'text', section: 'Medical Information' },
            { key: 'emergency_medical_contact', label: 'Emergency Medical Contact', type: 'text', section: 'Medical Information' },
          ]}
          submitLabel="Save Medical Info"
        />
      </CardContent>
    </Card>
  );
}
