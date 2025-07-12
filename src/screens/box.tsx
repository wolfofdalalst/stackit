import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";

export const Box = (): JSX.Element => {
  // Navigation categories
  const categories = [
    { name: "All", active: true },
    { name: "VLSI", active: false },
    { name: "Architecture", active: false },
    { name: "Engineering", active: false },
  ];

  // Questions for the stack
  const questions = [
    { id: 1, text: "How to implement VLSI design patterns?" },
    { id: 2, text: "Best practices for system architecture?" },
    { id: 3, text: "Debugging complex engineering problems?" },
  ];

  // Sample stack data
  const stacks = [
    {
      title: "VLSI Design",
      tag: "VLSI",
      relatedTags: "#semiconductor #design #circuits",
      questions: [
        "How to optimize power consumption in VLSI?",
        "What are the latest EDA tools?",
        "Clock tree synthesis best practices?"
      ]
    },
    {
      title: "System Architecture",
      tag: "ARCH",
      relatedTags: "#microservices #scalability #patterns",
      questions: [
        "How to design scalable microservices?",
        "Database sharding strategies?",
        "Load balancing techniques?"
      ]
    },
    {
      title: "Software Engineering",
      tag: "SWE",
      relatedTags: "#algorithms #datastructures #coding",
      questions: [
        "Dynamic programming optimization?",
        "Graph algorithms implementation?",
        "Code review best practices?"
      ]
    },
    {
      title: "Machine Learning",
      tag: "ML",
      relatedTags: "#ai #deeplearning #neural",
      questions: [
        "Neural network architecture design?",
        "Overfitting prevention techniques?",
        "Model deployment strategies?"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100/20 via-black to-black">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-black/50 backdrop-blur-sm">
        {/* Logo */}
        <div className="text-4xl md:text-5xl font-extrabold">
          <span className="text-[#ede0d4]">Stack</span>
          <span className="text-[#ff6600]">it</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-4xl mx-8">
          <div className="relative flex items-center bg-[#2d2d2d] rounded-2xl px-6 py-4">
            <SearchIcon className="w-8 h-8 text-[#b3b3b3] mr-4" />
            <Input
              className="border-none bg-transparent text-xl text-[#b3b3b3] font-normal placeholder:text-[#b3b3b3] focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              placeholder="Search questions, topics, or tags..."
            />
          </div>
        </div>

        {/* Ask Question Button */}
        <Button className="bg-[#ff6600] hover:bg-[#ff6600]/80 text-[#ede0d4] text-xl font-medium px-8 py-4 rounded-2xl transition-all duration-200">
          Ask Question
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-20 min-h-screen bg-black/30 backdrop-blur-sm flex flex-col items-center py-8">
          {/* Navigation Icons */}
          <div className="flex flex-col items-center space-y-8 mb-auto">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#ff6600] rounded-2xl"></div>
              <HomeIcon className="relative w-8 h-8 text-white z-10" />
            </div>
            <BellIcon className="w-8 h-8 text-white/70 hover:text-white transition-colors cursor-pointer" />
          </div>

          {/* User Profile */}
          <div className="flex flex-col items-center space-y-8">
            <UserIcon className="w-8 h-8 text-white/70 hover:text-white transition-colors cursor-pointer" />
            <LogOutIcon className="w-8 h-8 text-white/70 hover:text-white transition-colors cursor-pointer" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Categories */}
          <div className="bg-[#2d2d2d] rounded-2xl p-6 mb-8">
            <div className="flex flex-wrap gap-4">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`text-[#ede0d4] text-lg font-medium px-6 py-3 rounded-2xl transition-all duration-200 ${
                    category.active 
                      ? "bg-[#ff6600] hover:bg-[#ff6600]/80" 
                      : "hover:bg-white/10"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stacks.map((stack, index) => (
              <Card key={index} className="bg-[#2d2d2d] border-none rounded-2xl hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-[#ede0d4] mb-2">
                      {stack.title}
                    </h3>
                    <span className="inline-block bg-[#ff6600] text-white text-sm font-medium px-3 py-1 rounded-full">
                      {stack.tag}
                    </span>
                  </div>
                  
                  <p className="text-[#b3b3b3] text-sm mb-6">
                    {stack.relatedTags}
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-[#ede0d4] font-medium">Recent Questions:</h4>
                    {stack.questions.map((question, qIndex) => (
                      <React.Fragment key={qIndex}>
                        <p className="text-white/80 text-sm hover:text-white transition-colors cursor-pointer">
                          {question}
                        </p>
                        {qIndex < stack.questions.length - 1 && (
                          <Separator className="bg-white/20" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/20">
                    <div className="flex justify-between text-xs text-[#b3b3b3]">
                      <span>24 questions</span>
                      <span>156 answers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-[#ede0d4] mb-6">Trending Questions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#2d2d2d] border-none rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#ede0d4] mb-4">
                    How to optimize memory usage in embedded systems?
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-[#ff6600]/20 text-[#ff6600] text-xs px-2 py-1 rounded-full">embedded</span>
                    <span className="bg-[#ff6600]/20 text-[#ff6600] text-xs px-2 py-1 rounded-full">memory</span>
                    <span className="bg-[#ff6600]/20 text-[#ff6600] text-xs px-2 py-1 rounded-full">optimization</span>
                  </div>
                  <p className="text-[#b3b3b3] text-sm mb-4">
                    Looking for best practices to reduce memory footprint in resource-constrained embedded applications...
                  </p>
                  <div className="flex justify-between text-xs text-[#b3b3b3]">
                    <span>5 answers</span>
                    <span>2 hours ago</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#2d2d2d] border-none rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#ede0d4] mb-4">
                    Best practices for microservice communication?
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-[#ff6600]/20 text-[#ff6600] text-xs px-2 py-1 rounded-full">microservices</span>
                    <span className="bg-[#ff6600]/20 text-[#ff6600] text-xs px-2 py-1 rounded-full">architecture</span>
                    <span className="bg-[#ff6600]/20 text-[#ff6600] text-xs px-2 py-1 rounded-full">communication</span>
                  </div>
                  <p className="text-[#b3b3b3] text-sm mb-4">
                    What are the recommended patterns for service-to-service communication in a distributed system...
                  </p>
                  <div className="flex justify-between text-xs text-[#b3b3b3]">
                    <span>12 answers</span>
                    <span>4 hours ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};