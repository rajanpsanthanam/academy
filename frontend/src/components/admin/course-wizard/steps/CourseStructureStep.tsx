import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';

interface CourseStructureStepProps {
  data: {
    modules: Array<{
      title: string;
      description: string;
      lessons: Array<{
        title: string;
        description: string;
        content: string;
      }>;
    }>;
  };
  onChange: (data: Partial<CourseStructureStepProps['data']>) => void;
}

export function CourseStructureStep({ data, onChange }: CourseStructureStepProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'module') {
      const newModules = Array.from(data.modules);
      const [removed] = newModules.splice(source.index, 1);
      newModules.splice(destination.index, 0, removed);
      onChange({ modules: newModules });
    } else if (type === 'lesson') {
      const moduleId = source.droppableId;
      const newModules = Array.from(data.modules);
      const module = newModules.find((_, index) => index.toString() === moduleId);
      if (!module) return;

      const newLessons = Array.from(module.lessons);
      const [removed] = newLessons.splice(source.index, 1);
      newLessons.splice(destination.index, 0, removed);

      module.lessons = newLessons;
      onChange({ modules: newModules });
    }
  };

  const addModule = () => {
    const newModule = {
      title: '',
      description: '',
      lessons: [],
    };
    onChange({ modules: [...data.modules, newModule] });
  };

  const updateModule = (index: number, field: 'title' | 'description', value: string) => {
    const newModules = [...data.modules];
    newModules[index] = { ...newModules[index], [field]: value };
    onChange({ modules: newModules });
  };

  const deleteModule = (index: number) => {
    const newModules = data.modules.filter((_, i) => i !== index);
    onChange({ modules: newModules });
  };

  const addLesson = (moduleIndex: number) => {
    const newModules = [...data.modules];
    newModules[moduleIndex].lessons.push({
      title: '',
      description: '',
      content: '',
    });
    onChange({ modules: newModules });
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    field: 'title' | 'description' | 'content',
    value: string
  ) => {
    const newModules = [...data.modules];
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      [field]: value,
    };
    onChange({ modules: newModules });
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...data.modules];
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter(
      (_, i) => i !== lessonIndex
    );
    onChange({ modules: newModules });
  };

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index.toString())) {
      newExpanded.delete(index.toString());
    } else {
      newExpanded.add(index.toString());
    }
    setExpandedModules(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Course Structure</h3>
        <Button onClick={addModule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="modules" type="module">
          {(provided: DroppableProvided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {data.modules.map((module, moduleIndex) => (
                <Draggable
                  key={moduleIndex}
                  draggableId={`module-${moduleIndex}`}
                  index={moduleIndex}
                >
                  {(provided: DraggableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="mb-4"
                    >
                      <Card>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div {...provided.dragHandleProps}>
                                <ChevronUp className="h-4 w-4" />
                                <ChevronDown className="h-4 w-4" />
                              </div>
                              <Input
                                value={module.title}
                                onChange={(e) =>
                                  updateModule(moduleIndex, 'title', e.target.value)
                                }
                                placeholder="Module title"
                                className="w-64"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleModule(moduleIndex)}
                              >
                                {expandedModules.has(moduleIndex.toString()) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteModule(moduleIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {expandedModules.has(moduleIndex.toString()) && (
                          <CardContent className="p-4 pt-0">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Module Description</Label>
                                <Textarea
                                  value={module.description}
                                  onChange={(e) =>
                                    updateModule(
                                      moduleIndex,
                                      'description',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Module description"
                                />
                              </div>

                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-medium">Lessons</h4>
                                  <Button
                                    size="sm"
                                    onClick={() => addLesson(moduleIndex)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Lesson
                                  </Button>
                                </div>

                                <Droppable
                                  droppableId={moduleIndex.toString()}
                                  type="lesson"
                                >
                                  {(provided: DroppableProvided) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className="space-y-2"
                                    >
                                      {module.lessons.map((lesson, lessonIndex) => (
                                        <Draggable
                                          key={lessonIndex}
                                          draggableId={`lesson-${moduleIndex}-${lessonIndex}`}
                                          index={lessonIndex}
                                        >
                                          {(provided: DraggableProvided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className="p-4 border rounded-lg bg-muted/50"
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <div
                                                  {...provided.dragHandleProps}
                                                  className="flex items-center space-x-2"
                                                >
                                                  <ChevronUp className="h-4 w-4" />
                                                  <ChevronDown className="h-4 w-4" />
                                                  <Input
                                                    value={lesson.title}
                                                    onChange={(e) =>
                                                      updateLesson(
                                                        moduleIndex,
                                                        lessonIndex,
                                                        'title',
                                                        e.target.value
                                                      )
                                                    }
                                                    placeholder="Lesson title"
                                                    className="w-64"
                                                  />
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    deleteLesson(
                                                      moduleIndex,
                                                      lessonIndex
                                                    )
                                                  }
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="space-y-2">
                                                <Textarea
                                                  value={lesson.description}
                                                  onChange={(e) =>
                                                    updateLesson(
                                                      moduleIndex,
                                                      lessonIndex,
                                                      'description',
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="Lesson description"
                                                  className="min-h-[60px]"
                                                />
                                                <Textarea
                                                  value={lesson.content}
                                                  onChange={(e) =>
                                                    updateLesson(
                                                      moduleIndex,
                                                      lessonIndex,
                                                      'content',
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="Lesson content"
                                                  className="min-h-[100px]"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 