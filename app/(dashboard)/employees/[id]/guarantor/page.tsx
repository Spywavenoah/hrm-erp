'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicForm } from '@/components/field-engine/dynamic-form';

export default function GuarantorPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Guarantor Information</CardTitle>
      </CardHeader>
      <CardContent>
        <DynamicForm
          moduleKey="employee_guarantor"
          recordId={id}
          systemFieldDefs={[
            { key: 'guarantor_name', label: 'Guarantor Full Name', type: 'text', required: true, section: 'Guarantor Details' },
            { key: 'guarantor_relationship', label: 'Relationship to Employee', type: 'text', section: 'Guarantor Details' },
            { key: 'guarantor_phone', label: 'Phone Number', type: 'text', required: true, section: 'Guarantor Details' },
            { key: 'guarantor_email', label: 'Email Address', type: 'text', section: 'Guarantor Details' },
            { key: 'guarantor_address', label: 'Home Address', type: 'text', section: 'Guarantor Details' },
            { key: 'guarantor_occupation', label: 'Occupation', type: 'text', section: 'Guarantor Details' },
            { key: 'guarantor_employer', label: 'Employer Name', type: 'text', section: 'Guarantor Details' },
          ]}
          submitLabel="Save Guarantor Info"
        />
      </CardContent>
    </Card>
  );
}
