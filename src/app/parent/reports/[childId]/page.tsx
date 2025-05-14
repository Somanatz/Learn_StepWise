// src/app/parent/reports/[childId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, UserCircle, CalendarDays, BarChartBig, MessageSquare } from "lucide-react";

// Mock data - in a real app, fetch this based on childId
const mockReportCardData = {
  child1: {
    studentName: "Alex Johnson",
    avatarUrl: "https://placehold.co/100x100.png",
    classLevel: 5,
    reportDate: "July 15, 2024",
    schoolName: "Oakwood Elementary",
    teacherName: "Dr. Emily Carter",
    overallGrade: "B+",
    overallComments: "Alex has demonstrated commendable progress this term, particularly in Mathematics where problem-solving skills have notably improved. Consistent effort in Science projects is evident. To further enhance learning, Alex is encouraged to participate more actively in History class discussions and focus on developing descriptive writing techniques in English. Overall, a positive term with strong potential for future growth.",
    subjects: [
      { name: "Mathematics", score: 88, grade: "B+", comments: "Excellent understanding of fractions and decimals. Good problem-solving skills." },
      { name: "Science", score: 92, grade: "A-", comments: "Strong performance in experiments. Actively participates in group projects." },
      { name: "English", score: 82, grade: "B", comments: "Good comprehension skills. Needs to work on descriptive writing." },
      { name: "History", score: 78, grade: "C+", comments: "Understands key historical events. More active participation would be beneficial." },
      { name: "Art", score: 95, grade: "A", comments: "Shows great creativity and technical skill." },
    ]
  },
   child2: {
    studentName: "Mia Williams",
    avatarUrl: "https://placehold.co/100x100.png",
    classLevel: 3,
    reportDate: "July 12, 2024",
    schoolName: "Willow Creek Academy",
    teacherName: "Ms. Sarah Davis",
    overallGrade: "C+",
    overallComments: "Mia is a delightful student who is making steady progress in foundational skills. She shows enthusiasm for reading and phonics. Continued practice with basic math concepts, particularly addition and subtraction, is recommended. Mia is encouraged to ask questions more frequently in class.",
    subjects: [
      { name: "Phonics", score: 75, grade: "B-", comments: "Good grasp of letter sounds. Improving in blending." },
      { name: "Basic Math", score: 68, grade: "C", comments: "Understands counting. Needs more practice with simple addition." },
      { name: "Reading Comprehension", score: 72, grade: "C+", comments: "Enjoys stories. Working on recalling details." },
      { name: "Handwriting", score: 80, grade: "B", comments: "Neat handwriting. Consistent letter formation." },
    ]
  }
  // ... other children reports
};

export default function ChildReportCardPage() {
  const params = useParams();
  const childId = params.childId as keyof typeof mockReportCardData | undefined;
  
  const reportData = childId && typeof childId === 'string' && mockReportCardData[childId] 
                      ? mockReportCardData[childId] 
                      : mockReportCardData.child1; // Fallback to child1 if ID is invalid


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary-foreground">
              <AvatarImage src={reportData.avatarUrl} alt={reportData.studentName} data-ai-hint="child avatar"/>
              <AvatarFallback>{reportData.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold">{reportData.studentName}'s Report Card</CardTitle>
              <CardDescription className="text-primary-foreground/80 mt-1">
                {reportData.schoolName} - Class {reportData.classLevel}
              </CardDescription>
            </div>
            <FileText size={48} className="hidden sm:block" />
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm mb-6">
            <InfoBox icon={UserCircle} label="Teacher" value={reportData.teacherName} />
            <InfoBox icon={CalendarDays} label="Report Date" value={reportData.reportDate} />
            <InfoBox icon={BarChartBig} label="Overall Grade" value={reportData.overallGrade} className="font-bold text-lg" />
          </div>
          
          <div className="p-6 bg-secondary rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3 text-secondary-foreground flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" /> Teacher's Overall Remarks
            </h3>
            <p className="text-foreground leading-relaxed italic">{reportData.overallComments}</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-primary">Subject Performance Details</h3>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Subject</TableHead>
                    <TableHead className="font-bold text-center">Score (%)</TableHead>
                    <TableHead className="font-bold text-center">Grade</TableHead>
                    <TableHead className="font-bold">Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.subjects.map((subject) => (
                    <TableRow key={subject.name}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell className="text-center">{subject.score}</TableCell>
                      <TableCell className="text-center font-semibold">{subject.grade}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{subject.comments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 md:p-8 bg-muted border-t">
          <p className="text-xs text-muted-foreground">This report reflects {reportData.studentName}'s performance for the term ending {reportData.reportDate}. Please contact {reportData.teacherName} for any clarifications.</p>
          <Button variant="default" size="lg" className="ml-auto">
            <Download className="mr-2 h-5 w-5" /> Download Report (PDF)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface InfoBoxProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  className?: string;
}
const InfoBox: React.FC<InfoBoxProps> = ({ icon: Icon, label, value, className }) => (
  <div className="p-4 bg-muted rounded-lg shadow">
    <p className="font-semibold text-muted-foreground flex items-center text-xs uppercase tracking-wider"><Icon className="mr-2 h-4 w-4" /> {label}:</p>
    <p className={`text-foreground mt-0.5 ${className}`}>{value}</p>
  </div>
);
