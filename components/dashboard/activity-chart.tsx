'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { month: 'Jan', hours: 12, students: 45 },
  { month: 'Feb', hours: 15, students: 52 },
  { month: 'Mar', hours: 18, students: 48 },
  { month: 'Apr', hours: 22, students: 61 },
  { month: 'May', hours: 25, students: 55 },
  { month: 'Jun', hours: 28, students: 67 },
  { month: 'Jul', hours: 32, students: 73 },
  { month: 'Aug', hours: 29, students: 69 },
  { month: 'Sep', hours: 26, students: 58 },
  { month: 'Oct', hours: 23, students: 52 },
  { month: 'Nov', hours: 20, students: 48 },
  { month: 'Dec', hours: 18, students: 45 }
];

export default function ActivityChart() {
  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Monthly learning hours and student engagement</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            This Year
          </Badge>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              className="text-sm text-gray-500"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-sm text-gray-500"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="hours" 
              fill="url(#gradient1)" 
              radius={[4, 4, 0, 0]}
              name="Learning Hours"
            />
            <defs>
              <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}