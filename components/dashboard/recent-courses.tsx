'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Users, Star } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Database Management',
    level: 'Advanced',
    duration: '6 hours',
    students: 45,
    rating: 4.8,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    title: 'Web Development',
    level: 'Intermediate',
    duration: '8 hours',
    students: 67,
    rating: 4.9,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 3,
    title: 'Data Structures',
    level: 'Beginner',
    duration: '4 hours',
    students: 32,
    rating: 4.7,
    color: 'from-purple-500 to-violet-500'
  },
  {
    id: 4,
    title: 'Machine Learning',
    level: 'Advanced',
    duration: '12 hours',
    students: 28,
    rating: 4.9,
    color: 'from-orange-500 to-red-500'
  }
];

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Beginner': return 'bg-green-100 text-green-800';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'Advanced': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function RecentCourses() {
  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Courses</CardTitle>
          <CardDescription>Latest course activities and enrollments</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={`bg-gradient-to-r ${course.color} text-white font-semibold`}>
                {course.title.split(' ').map(word => word[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{course.title}</h4>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{course.rating}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <Badge variant="secondary" className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{course.students} students</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}