// src/app/student/view-my-report/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, UserCircle, CalendarDays, BarChartBig, MessageSquare } from "lucide-react";

const mockReportData = {
  studentName: "Alex Johnson",
  classLevel: 5,
  reportDate: "July 15, 2024",
  overallGrade: "B+",
  overallComments: "Alex has shown consistent improvement throughout the semester, especially in Mathematics. Participation in class discussions for History could be enhanced. Keep up the good work!",
  subjects: [
    { name: "Mathematics", score: 88, grade: "B+", comments: "Excellent understanding of fractions and decimals. Good problem-solving skills." },
    { name: "Science", score: 92, grade: "A-", comments: "Strong performance in experiments. Actively participates in group projects." },
    { name: "English", score: 82, grade: "B", comments: "Good comprehension skills. Needs to work on descriptive writing." },
    { name: "History", score: 78, grade: "C+", comments: "Understands key historical events. More active participation in discussions would be beneficial." },
    { name: "Art", score: 95, grade: "A", comments: "Shows great creativity and technical skill." },
  ]
};

export default function StudentReportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold">My Academic Report</CardTitle>
              <CardDescription className="text-primary-foreground/80 mt-1">Summary of your performance for the current term.</CardDescription>
            </div>
            <UserCircle size={48} />
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 bg-secondary rounded-lg shadow">
              <p className="font-semibold text-secondary-foreground flex items-center"><UserCircle className="mr-2 h-5 w-5" /> Student Name:</p>
              <p className="text-foreground">{mockReportData.studentName}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg shadow">
              <p className="font-semibold text-secondary-foreground flex items-center"><BarChartBig className="mr-2 h-5 w-5" /> Class Level:</p>
              <p className="text-foreground">{mockReportData.classLevel}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg shadow">
              <p className="font-semibold text-secondary-foreground flex items-center"><CalendarDays className="mr-2 h-5 w-5" /> Report Date:</p>
              <p className="text-foreground">{mockReportData.reportDate}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-primary">Subject Performance</h3>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Subject</TableHead>
                    <TableHead className="font-bold text-center">Score (%)</TableHead>
                    <TableHead className="font-bold text-center">Grade</TableHead>
                    <TableHead className="font-bold">Teacher's Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReportData.subjects.map((subject) => (
                    <TableRow key={subject.name}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell className="text-center">{subject.score}</TableCell>
                      <TableCell className="text-center font-semibold">{subject.grade}</TableCell>
                      <TableCell className="text-muted-foreground italic">{subject.comments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="p-6 bg-muted rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary" /> Overall Summary & Remarks</h3>
            <p className="font-bold text-lg text-primary mb-2">Overall Grade: {mockReportData.overallGrade}</p>
            <p className="text-muted-foreground leading-relaxed">{mockReportData.overallComments}</p>
          </div>
        </CardContent>
        <CardFooter className="p-6 md:p-8 bg-secondary border-t">
          <Button variant="default" size="lg" className="ml-auto">
            <Download className="mr-2 h-5 w-5" /> Download Report (PDF)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
