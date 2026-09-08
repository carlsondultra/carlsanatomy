import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>carls anatomy</CardTitle>
          <CardDescription>
            Interactive X-Ray Annotation
          </CardDescription>
        </CardHeader>
        <CardContent>
          disclaimer - this is a personal project and not affiliated with any medical institution. The content is for educational purposes only and should not be used for medical diagnosis or treatment.
        </CardContent>
      </Card>
    </div>
  )
}