from django.core.management.base import BaseCommand
from courses.models import Course, Module, Lesson, Tag
from users.models import Organization
from django.utils import timezone

class Command(BaseCommand):
    help = 'Seeds the database with organizations and courses'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # Create common tags
        tags = {
            'programming': 'Programming and software development related courses',
            'data-science': 'Data science, machine learning, and analytics courses',
            'cloud': 'Cloud computing and infrastructure courses',
            'web': 'Web development and design courses',
            'mobile': 'Mobile app development courses',
            'devops': 'DevOps and system administration courses',
            'security': 'Cybersecurity and information security courses',
            'database': 'Database management and design courses',
            'ai': 'Artificial Intelligence and Machine Learning courses',
            'blockchain': 'Blockchain and cryptocurrency courses',
            'frontend': 'Frontend development and UI/UX courses',
            'backend': 'Backend development and server-side programming courses',
            'testing': 'Software testing and quality assurance courses',
            'architecture': 'Software architecture and design patterns courses',
            'networking': 'Computer networking and protocols courses'
        }

        # Create or update tags
        tag_objects = {}
        for name, description in tags.items():
            tag, created = Tag.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
            tag_objects[name] = tag
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created tag: {name}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Tag already exists: {name}'))

        # Get or create organization
        try:
            academy = Organization.objects.get(domain="academy.com")
            self.stdout.write(self.style.SUCCESS('Found existing organization: Academy'))
        except Organization.DoesNotExist:
            academy = Organization.objects.create(
                name="Academy",
                domain="academy.com"
            )
            self.stdout.write(self.style.SUCCESS('Created organization: Academy'))

        # Define courses with their tags and modules
        courses = [
            {
                'title': 'Modern Web Development with React and TypeScript',
                'description': 'Master modern web development with React and TypeScript. Learn to build scalable, type-safe web applications with the latest best practices and tools.',
                'tags': ['programming', 'web', 'frontend'],
                'modules': [
                    {
                        'title': 'TypeScript Fundamentals',
                        'description': 'Learn TypeScript from the ground up and understand its benefits in modern web development',
                        'lessons': [
                            {
                                'title': 'Introduction to TypeScript',
                                'description': 'Understanding TypeScript\'s core concepts and benefits',
                                'content': """
# Introduction to TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

## What is TypeScript?

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds static typing to JavaScript, making it more robust and maintainable.

### Key Benefits

- **Type Safety**: Catch errors during development
- **Better IDE Support**: Enhanced code completion and refactoring
- **Improved Maintainability**: Self-documenting code
- **Modern JavaScript Features**: Use latest ECMAScript features

## Basic Types

```typescript
// Primitive types
let name: string = "John";
let age: number = 30;
let isActive: boolean = true;

// Arrays
let numbers: number[] = [1, 2, 3];
let names: string[] = ["John", "Jane"];

// Objects
interface User {
  name: string;
  age: number;
  isActive: boolean;
}

const user: User = {
  name: "John",
  age: 30,
  isActive: true
};
```
                                """
                            },
                            {
                                'title': 'Advanced TypeScript Features',
                                'description': 'Exploring advanced TypeScript concepts and patterns',
                                'content': """
# Advanced TypeScript Features

## Generics

Generics allow us to create reusable components that can work with a variety of types.

```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Generic interface
interface GenericArray<T> {
  [index: number]: T;
}

// Generic class
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}
```

## Advanced Types

### Union Types
```typescript
type Status = 'active' | 'inactive' | 'pending';
type ID = string | number;
```

### Intersection Types
```typescript
interface HasName {
  name: string;
}

interface HasAge {
  age: number;
}

type Person = HasName & HasAge;
```
                                """
                            }
                        ]
                    },
                    {
                        'title': 'React Fundamentals',
                        'description': 'Learn React\'s core concepts and best practices',
                        'lessons': [
                            {
                                'title': 'React Components and Hooks',
                                'description': 'Understanding React components and hooks system',
                                'content': """
# React Components and Hooks

## Functional Components

Functional components are the modern way to write React components. They're simpler, more concise, and easier to test.

```typescript
interface GreetingProps {
  name: string;
  age?: number;
}

const Greeting: React.FC<GreetingProps> = ({ name, age }) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>You are {age} years old</p>}
    </div>
  );
};
```

## Hooks

Hooks are functions that let you "hook into" React state and lifecycle features from function components.

### useState
```typescript
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

### useEffect
```typescript
function DataFetcher({ url }: { url: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```
                                """
                            }
                        ]
                    }
                ]
            },
            {
                'title': 'Python for Data Science and Machine Learning',
                'description': 'Learn Python programming for data analysis, visualization, and machine learning using popular libraries like NumPy, Pandas, and Scikit-learn.',
                'tags': ['programming', 'data-science', 'ai'],
                'modules': [
                    {
                        'title': 'Python Data Science Fundamentals',
                        'description': 'Learn essential Python libraries for data science',
                        'lessons': [
                            {
                                'title': 'NumPy and Pandas Basics',
                                'description': 'Introduction to essential Python libraries for data manipulation',
                                'content': """
# NumPy and Pandas Basics

## NumPy: Numerical Computing

NumPy is the fundamental package for scientific computing in Python.

### Creating Arrays
```python
import numpy as np

# Create arrays
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.zeros((3, 3))
arr3 = np.ones((2, 4))
arr4 = np.arange(0, 10, 2)
arr5 = np.linspace(0, 1, 5)

# Array operations
result = arr1 * 2
sum_result = np.sum(arr1)
mean_result = np.mean(arr1)
```

## Pandas: Data Manipulation

Pandas provides high-performance, easy-to-use data structures and data analysis tools.

### Series and DataFrames
```python
import pandas as pd

# Create Series
s = pd.Series([1, 3, 5, np.nan, 6, 8])

# Create DataFrame
df = pd.DataFrame({
    'A': [1, 2, 3, 4],
    'B': pd.Timestamp('20230101'),
    'C': pd.Series(1, index=list(range(4)), dtype='float32'),
    'D': np.array([3] * 4, dtype='int32'),
    'E': pd.Categorical(["test", "train", "test", "train"]),
    'F': 'foo'
})
```
                                """
                            },
                            {
                                'title': 'Data Visualization with Matplotlib and Seaborn',
                                'description': 'Creating professional data visualizations',
                                'content': """
# Data Visualization with Matplotlib and Seaborn

## Matplotlib Basics

```python
import matplotlib.pyplot as plt
import numpy as np

# Create a simple line plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='Sine Wave')
plt.title('Simple Line Plot')
plt.xlabel('X-axis')
plt.ylabel('Y-axis')
plt.legend()
plt.grid(True)
plt.show()
```

## Seaborn for Statistical Visualization

```python
import seaborn as sns

# Load example dataset
tips = sns.load_dataset('tips')

# Create a scatter plot with regression line
sns.lmplot(x='total_bill', y='tip', data=tips, hue='smoker')
plt.title('Total Bill vs Tip Amount')
plt.show()

# Create a box plot
sns.boxplot(x='day', y='total_bill', data=tips)
plt.title('Total Bill by Day')
plt.show()
```
                                """
                            }
                        ]
                    },
                    {
                        'title': 'Machine Learning Fundamentals',
                        'description': 'Introduction to machine learning concepts and algorithms',
                        'lessons': [
                            {
                                'title': 'Introduction to Scikit-learn',
                                'description': 'Getting started with machine learning using Scikit-learn',
                                'content': """
# Introduction to Scikit-learn

## Basic Machine Learning Workflow

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

# Load and prepare data
X = df[['feature1', 'feature2']]
y = df['target']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# Make predictions
y_pred = model.predict(X_test_scaled)

# Evaluate model
mse = mean_squared_error(y_test, y_pred)
print(f'Mean Squared Error: {mse}')
```

## Common Algorithms

### Linear Regression
```python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)
```

### Decision Trees
```python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier()
model.fit(X_train, y_train)
```

### Random Forest
```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier()
model.fit(X_train, y_train)
```
                                """
                            }
                        ]
                    }
                ]
            }
        ]

        # Create courses
        for course_data in courses:
            try:
                course = Course.objects.get(
                    organization=academy,
                    title=course_data['title']
                )
                self.stdout.write(self.style.SUCCESS(f'Found existing course: {course.title}'))
            except Course.DoesNotExist:
                course = Course.objects.create(
                    organization=academy,
                    title=course_data['title'],
                    description=course_data['description'],
                    status="PUBLISHED"
                )
                self.stdout.write(self.style.SUCCESS(f'Created course: {course.title}'))

            # Add relevant tags
            for tag_name in course_data['tags']:
                course.tags.add(tag_objects[tag_name])

            # Create modules and lessons
            for module_data in course_data['modules']:
                try:
                    module = Module.objects.get(
                        course=course,
                        title=module_data['title']
                    )
                    self.stdout.write(self.style.SUCCESS(f'Found existing module: {module.title}'))
                except Module.DoesNotExist:
                    module = Module.objects.create(
                        course=course,
                        title=module_data['title'],
                        description=module_data['description'],
                        order=len(course.modules.all()) + 1
                    )
                    self.stdout.write(self.style.SUCCESS(f'Created module: {module.title}'))

                for lesson_data in module_data['lessons']:
                    try:
                        lesson = Lesson.objects.get(
                            module=module,
                            title=lesson_data['title']
                        )
                        self.stdout.write(self.style.SUCCESS(f'Found existing lesson: {lesson.title}'))
                    except Lesson.DoesNotExist:
                        lesson = Lesson.objects.create(
                            module=module,
                            title=lesson_data['title'],
                            description=lesson_data['description'],
                            content=lesson_data['content'],
                            order=len(module.lessons.all()) + 1
                        )
                        self.stdout.write(self.style.SUCCESS(f'Created lesson: {lesson.title}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database!')) 