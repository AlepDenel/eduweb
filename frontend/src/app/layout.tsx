import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "EduWeb — Student Learning Portal",
  description: "EduWeb is a modern academic portal for courses, resources, quizzes, forum discussions, and the bookstore.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className={`${inter.variable} font-sans bg-slate-50 text-slate-900`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
