"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

interface UIElement {
  id: string
  name: string
  description: string
  type: "button" | "text field" | "dropdown" | "card" | "icon" | "image" | "other"
  x: number
  y: number
}

interface UserRequirement {
  id: string
  title: string
  description: string
}

interface ScreenRelationship {
  screenId: string
  relationship: "leads to" | "comes from" | "alternative to" | "variant of"
  description: string
}

interface FigmaScreen {
  id: string
  title: string
  imageUrl: string
  description: string
  elements: UIElement[]
  requirements: UserRequirement[]
  relationships: ScreenRelationship[]
}

interface FigmaDocumentationProps {
  screens: FigmaScreen[]
  initialScreenIndex?: number
}

export function FigmaDocumentation({ screens, initialScreenIndex = 0 }: FigmaDocumentationProps) {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(initialScreenIndex)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null)

  const currentScreen = screens[currentScreenIndex]

  const goToNextScreen = () => {
    if (currentScreenIndex < screens.length - 1) {
      setCurrentScreenIndex(currentScreenIndex + 1)
      setHighlightedElement(null)
    }
  }

  const goToPreviousScreen = () => {
    if (currentScreenIndex > 0) {
      setCurrentScreenIndex(currentScreenIndex - 1)
      setHighlightedElement(null)
    }
  }

  const zoomIn = () => {
    if (zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25)
    }
  }

  const zoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25)
    }
  }

  const highlightElement = (elementId: string) => {
    setHighlightedElement(elementId === highlightedElement ? null : elementId)
  }

  if (!currentScreen) {
    return <div className="p-8 text-center">No screens available</div>
  }

  return (
    <div className="bg-[#BBE0E5] min-h-screen p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#E4D7BE] border-b-4 border-[#DFB97D] p-4">
          <h1 className="text-2xl font-bold">{currentScreen.title}</h1>
          <p className="text-gray-700 mt-1">{currentScreen.description}</p>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row">
          {/* Left side - Figma image */}
          <div className="md:w-2/3 p-4 border-r border-[#DFB97D] relative">
            <div className="sticky top-4 flex justify-between mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={goToPreviousScreen}
                  disabled={currentScreenIndex === 0}
                  className="bg-[#E4D7BE] border-2 border-[#DFB97D] rounded-lg p-2 disabled:opacity-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={goToNextScreen}
                  disabled={currentScreenIndex === screens.length - 1}
                  className="bg-[#E4D7BE] border-2 border-[#DFB97D] rounded-lg p-2 disabled:opacity-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="bg-[#E4D7BE] border-2 border-[#DFB97D] rounded-lg p-2 disabled:opacity-50"
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  onClick={zoomIn}
                  disabled={zoomLevel >= 2}
                  className="bg-[#E4D7BE] border-2 border-[#DFB97D] rounded-lg p-2 disabled:opacity-50"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-auto border-2 border-[#DFB97D] rounded-xl">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top left",
                  width: `${100 / zoomLevel}%`,
                  height: `${100 / zoomLevel}%`,
                  position: "relative",
                }}
              >
                <Image
                  src={currentScreen.imageUrl || "/placeholder.svg"}
                  alt={currentScreen.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />

                {/* Element highlights */}
                {currentScreen.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute border-2 rounded transition-all cursor-pointer ${
                      highlightedElement === element.id
                        ? "border-red-500 bg-red-200/30"
                        : "border-transparent hover:border-blue-500"
                    }`}
                    style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: "100px",
                      height: "40px",
                    }}
                    onClick={() => highlightElement(element.id)}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Documentation */}
          <div className="md:w-1/3 p-4 overflow-y-auto max-h-[calc(100vh-150px)]">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 border-b-2 border-[#DFB97D] pb-1">UI Elements</h2>
              <div className="space-y-4">
                {currentScreen.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-3 rounded-lg transition-colors cursor-pointer ${
                      highlightedElement === element.id ? "bg-[#E4D7BE] border-2 border-[#DFB97D]" : "hover:bg-gray-100"
                    }`}
                    onClick={() => highlightElement(element.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{element.name}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">{element.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{element.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 border-b-2 border-[#DFB97D] pb-1">User Requirements</h2>
              <div className="space-y-4">
                {currentScreen.requirements.map((requirement) => (
                  <div key={requirement.id} className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">{requirement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{requirement.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2 border-b-2 border-[#DFB97D] pb-1">Screen Relationships</h2>
              <div className="space-y-4">
                {currentScreen.relationships.map((relationship, index) => {
                  const relatedScreen = screens.find((screen) => screen.id === relationship.screenId)
                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{relatedScreen?.title || "Unknown Screen"}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">{relationship.relationship}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{relationship.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
