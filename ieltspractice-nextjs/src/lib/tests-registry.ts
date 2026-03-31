export interface TestConfig {
  id: string;
  title: string;
  type: 'reading' | 'listening' | 'writing' | 'speaking';
  duration: number; // in minutes
  description: string;
  icon: string;
  color: string;
  requires: string[];
}

export const TESTS_REGISTRY: TestConfig[] = [
  // Reading Tests (Academic Practice)
  {
    id: 'R_AP_01',
    title: 'Academic Reading Test 1',
    type: 'reading',
    duration: 60,
    description: 'Climate change passage with multiple choice and text completion questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_02',
    title: 'Academic Reading Test 2',
    type: 'reading',
    duration: 60,
    description: 'Technology and society passage with matching headings questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_03',
    title: 'Academic Reading Test 3',
    type: 'reading',
    duration: 60,
    description: 'Environmental science passage with true/false/not given questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_04',
    title: 'Academic Reading Test 4',
    type: 'reading',
    duration: 60,
    description: 'Medical research passage with summary completion questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_05',
    title: 'Academic Reading Test 5',
    type: 'reading',
    duration: 60,
    description: 'Economics passage with multiple choice and diagram labeling.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_06',
    title: 'Academic Reading Test 6',
    type: 'reading',
    duration: 60,
    description: 'Psychology passage with matching features questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_07',
    title: 'Academic Reading Test 7',
    type: 'reading',
    duration: 60,
    description: 'History passage with sentence completion questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_08',
    title: 'Academic Reading Test 8',
    type: 'reading',
    duration: 60,
    description: 'Biology passage with short answer questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_09',
    title: 'Academic Reading Test 9',
    type: 'reading',
    duration: 60,
    description: 'Architecture passage with matching information questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },
  {
    id: 'R_AP_10',
    title: 'Academic Reading Test 10',
    type: 'reading',
    duration: 60,
    description: 'Space exploration passage with classification questions.',
    icon: '📚',
    color: 'bg-blue-500',
    requires: ['reading-comprehension', 'vocabulary', 'time-management']
  },

  // Listening Tests (Academic Practice)
  {
    id: 'L_AP_01',
    title: 'Academic Listening Test 1',
    type: 'listening',
    duration: 30,
    description: 'AI lecture with multiple choice and note completion questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_02',
    title: 'Academic Listening Test 2',
    type: 'listening',
    duration: 30,
    description: 'University campus conversation with form completion questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_03',
    title: 'Academic Listening Test 3',
    type: 'listening',
    duration: 30,
    description: 'Environmental science lecture with map labeling questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_04',
    title: 'Academic Listening Test 4',
    type: 'listening',
    duration: 30,
    description: 'Business seminar with matching questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_05',
    title: 'Academic Listening Test 5',
    type: 'listening',
    duration: 30,
    description: 'Medical consultation with multiple choice questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_06',
    title: 'Academic Listening Test 6',
    type: 'listening',
    duration: 30,
    description: 'History documentary with sentence completion questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_07',
    title: 'Academic Listening Test 7',
    type: 'listening',
    duration: 30,
    description: 'Technology discussion with table completion questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_08',
    title: 'Academic Listening Test 8',
    type: 'listening',
    duration: 30,
    description: 'Academic tutorial with diagram labeling questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_09',
    title: 'Academic Listening Test 9',
    type: 'listening',
    duration: 30,
    description: 'Research presentation with short answer questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },
  {
    id: 'L_AP_10',
    title: 'Academic Listening Test 10',
    type: 'listening',
    duration: 30,
    description: 'Student discussion with classification questions.',
    icon: '🎧',
    color: 'bg-green-500',
    requires: ['listening-comprehension', 'note-taking', 'concentration']
  },

  // Writing Tests (Academic Task)
  {
    id: 'W_AT_01',
    title: 'Academic Writing Test 1',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Internet access chart | Task 2: Technology complexity essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_02',
    title: 'Academic Writing Test 2',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Population growth graph | Task 2: Education system essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_03',
    title: 'Academic Writing Test 3',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Energy consumption diagram | Task 2: Environmental protection essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_04',
    title: 'Academic Writing Test 4',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Transport methods table | Task 2: Urbanization essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_05',
    title: 'Academic Writing Test 5',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Employment sectors pie chart | Task 2: Globalization essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_06',
    title: 'Academic Writing Test 6',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Temperature graph | Task 2: Healthcare essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_07',
    title: 'Academic Writing Test 7',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Tourism statistics | Task 2: Social media essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_08',
    title: 'Academic Writing Test 8',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Education flowchart | Task 2: Artificial intelligence essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_09',
    title: 'Academic Writing Test 9',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Manufacturing process | Task 2: Climate change essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },
  {
    id: 'W_AT_10',
    title: 'Academic Writing Test 10',
    type: 'writing',
    duration: 60,
    description: 'Task 1: Water usage map | Task 2: Work-life balance essay.',
    icon: '✍️',
    color: 'bg-purple-500',
    requires: ['writing-structure', 'grammar', 'vocabulary', 'time-management']
  },

  // Speaking Tests (Academic Practice)
  {
    id: 'S_AP_01',
    title: 'Speaking Test 1',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Hometown | Part 2: Memorable journey | Part 3: Tourism discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_02',
    title: 'Speaking Test 2',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Work/studies | Part 2: Favorite book | Part 3: Reading discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_03',
    title: 'Speaking Test 3',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Family | Part 2: Childhood memory | Part 3: Family values discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_04',
    title: 'Speaking Test 4',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Hobbies | Part 2: Ideal job | Part 3: Career discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_05',
    title: 'Speaking Test 5',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Food | Part 2: Special meal | Part 3: Food culture discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_06',
    title: 'Speaking Test 6',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Technology | Part 2: Useful device | Part 3: Technology impact discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_07',
    title: 'Speaking Test 7',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Weather | Part 2: Weather event | Part 3: Climate discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_08',
    title: 'Speaking Test 8',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Music | Part 2: Favorite song | Part 3: Music industry discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_09',
    title: 'Speaking Test 9',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Sports | Part 2: Sports event | Part 3: Sports in society discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  },
  {
    id: 'S_AP_10',
    title: 'Speaking Test 10',
    type: 'speaking',
    duration: 14,
    description: 'Part 1: Travel | Part 2: Dream destination | Part 3: Tourism industry discussion.',
    icon: '🎤',
    color: 'bg-orange-500',
    requires: ['speaking-fluency', 'pronunciation', 'vocabulary', 'grammar']
  }
];

export function getTestById(id: string): TestConfig | undefined {
  return TESTS_REGISTRY.find(test => test.id === id);
}

export function getTestsByType(type: 'reading' | 'listening' | 'writing' | 'speaking'): TestConfig[] {
  return TESTS_REGISTRY.filter(test => test.type === type);
}
