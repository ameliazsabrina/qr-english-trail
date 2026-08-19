import type { LearningPoint, Question } from "@bonjotan/shared-types";

type QuestionSeed = readonly [prompt: string, correct: string, wrongA: string, wrongB: string, explanation: string];

function questions(prefix: string, seeds: readonly QuestionSeed[]): Question[] {
  return seeds.map(([prompt, correct, wrongA, wrongB, explanation], index) => ({
    id: `${prefix}-q${index + 1}`,
    type: "multiple-choice",
    prompt,
    options: [
      { id: "a", label: correct },
      { id: "b", label: wrongA },
      { id: "c", label: wrongB }
    ],
    correctOptionId: "a",
    explanation,
    active: true,
    difficulty: index < 3 ? "easy" : "medium"
  }));
}

function point(
  pointNumber: number,
  slug: string,
  title: string,
  topic: string,
  body: string,
  examples: Array<{ english: string; translation: string }>,
  seeds: readonly QuestionSeed[]
): LearningPoint {
  return {
    id: `point-${String(pointNumber).padStart(2, "0")}`,
    slug,
    pointNumber,
    title,
    topic,
    status: "active",
    lesson: { heading: title, body, examples },
    questions: questions(`p${String(pointNumber).padStart(2, "0")}`, seeds),
    contentVersion: "2026.08.1"
  };
}

export const learningPoints: LearningPoint[] = [
  point(1, "greetings", "Hello, Bonjotan!", "Greetings", "Greetings help us start a friendly conversation. Use hello at any time and good morning before noon.", [
    { english: "Hello!", translation: "Halo!" },
    { english: "Good morning!", translation: "Selamat pagi!" }
  ], [
    ["What can you say when you meet someone?", "Hello!", "Goodbye!", "Sorry!", "Hello is a friendly greeting."],
    ["Which greeting is best before noon?", "Good morning!", "Good night!", "See you!", "We use good morning earlier in the day."],
    ["Someone says, ‘Hello!’ What can you reply?", "Hello!", "No!", "Tomorrow!", "You can greet them back with hello."],
    ["Which phrase means ‘Selamat sore’?", "Good afternoon!", "Good morning!", "Good night!", "Good afternoon is used later in the day."],
    ["What do you say when leaving?", "Goodbye!", "Welcome!", "Please!", "Goodbye is used when you leave."]
  ]),
  point(2, "introductions", "Meet a New Friend", "Introductions", "Use My name is… to introduce yourself, and ask What is your name? to learn another person's name.", [
    { english: "My name is Rara.", translation: "Nama saya Rara." },
    { english: "Nice to meet you.", translation: "Senang bertemu denganmu." }
  ], [
    ["How do you introduce yourself?", "My name is Dito.", "Your name is Dito.", "Goodbye, Dito.", "Use My name is… for your own name."],
    ["How do you ask someone’s name?", "What is your name?", "Where is your name?", "How old is a name?", "What is your name? asks for a name."],
    ["What can you say after an introduction?", "Nice to meet you.", "Turn left.", "I am hungry.", "Nice to meet you is a friendly response."],
    ["Complete: ‘I ___ Sari.’", "am", "is", "are", "Use am with I."],
    ["Which answer fits ‘What is your name?’", "I’m Bima.", "I’m fine.", "It is blue.", "I’m Bima answers with a name."]
  ]),
  point(3, "directions", "Which Way?", "Directions", "Direction words help visitors find their way. Left and right show direction; straight ahead means keep moving forward.", [
    { english: "Turn left.", translation: "Belok kiri." },
    { english: "Go straight ahead.", translation: "Jalan terus." }
  ], [
    ["Which phrase means ‘Belok kanan’?", "Turn right.", "Turn left.", "Sit down.", "Turn right means belok kanan."],
    ["What does ‘go straight ahead’ mean?", "Keep moving forward.", "Walk backward.", "Stop here.", "Straight ahead tells you to continue forward."],
    ["The shop is beside the park. Which word fits?", "next to", "under", "inside", "Next to means beside."],
    ["How can you ask for help finding a place?", "Where is the park?", "What is the park?", "Who is the park?", "Where asks about a location."],
    ["Opposite of left is…", "right", "straight", "near", "Right is the opposite direction from left."]
  ]),
  point(4, "places", "Places Around Us", "Places", "We use place words to describe our neighborhood, such as park, school, market, and library.", [
    { english: "This is the market.", translation: "Ini pasar." },
    { english: "The park is nearby.", translation: "Taman itu dekat." }
  ], [
    ["Where can you borrow books?", "library", "market", "playground", "A library has books to read or borrow."],
    ["Where do students learn?", "school", "bridge", "shop", "Students learn at school."],
    ["Where can people buy vegetables?", "market", "library", "park", "A market is a place to buy food and goods."],
    ["Which place often has swings?", "playground", "clinic", "road", "A playground is made for play."],
    ["Complete: ‘The park is ___ the school.’", "near", "drink", "happy", "Near describes a short distance between places."]
  ]),
  point(5, "everyday-objects", "Things We Use", "Everyday objects", "English names for familiar objects make daily conversations easier. Look around and name what you see.", [
    { english: "This is a bottle.", translation: "Ini botol." },
    { english: "That is a chair.", translation: "Itu kursi." }
  ], [
    ["Which object holds drinking water?", "bottle", "chair", "book", "A bottle can hold water."],
    ["Which object do you sit on?", "chair", "pencil", "door", "You sit on a chair."],
    ["Which object do you use for writing?", "pencil", "cup", "shoe", "A pencil is used for writing."],
    ["Complete: ‘This ___ a book.’", "is", "are", "am", "Use is with this."],
    ["What is the plural of ‘bag’?", "bags", "bages", "bag", "Most plurals add s: bag becomes bags."]
  ]),
  point(6, "daily-activities", "My Day", "Daily activities", "Simple verbs describe things we do every day: wake up, eat, study, play, and sleep.", [
    { english: "I study in the morning.", translation: "Saya belajar pada pagi hari." },
    { english: "We play after school.", translation: "Kami bermain setelah sekolah." }
  ], [
    ["What do you usually do after waking up?", "get out of bed", "say good night", "close the school", "You get out of bed after waking up."],
    ["Which verb means ‘belajar’?", "study", "sleep", "drink", "Study means belajar."],
    ["Complete: ‘We ___ football.’", "play", "plays", "playing", "Use the base verb play with we."],
    ["Which activity happens at night?", "sleep", "eat breakfast", "go to school", "People usually sleep at night."],
    ["What meal do we often eat in the morning?", "breakfast", "dinner", "snack", "Breakfast is the morning meal."]
  ]),
  point(7, "polite-words", "Kind Words", "Polite words", "Polite words show respect and kindness. Say please when asking, thank you when receiving, and sorry after a mistake.", [
    { english: "Please help me.", translation: "Tolong bantu saya." },
    { english: "Thank you!", translation: "Terima kasih!" }
  ], [
    ["What polite word belongs in a request?", "please", "never", "quickly", "Please makes a request polite."],
    ["Someone helps you. What do you say?", "Thank you.", "Go away.", "Turn left.", "Thank you shows appreciation."],
    ["You bump into someone. What should you say?", "Sorry.", "Welcome.", "Good morning.", "Sorry is used after a mistake or accident."],
    ["Someone says ‘Thank you.’ How can you reply?", "You’re welcome.", "I’m sorry.", "Excuse you.", "You’re welcome is a polite reply to thanks."],
    ["How can you politely get attention?", "Excuse me.", "Be quiet.", "No thanks.", "Excuse me politely gets someone’s attention."]
  ]),
  point(8, "food-and-drinks", "Tasty Words", "Food and drinks", "Use food and drink words to say what you like, want, or need.", [
    { english: "I like rice.", translation: "Saya suka nasi." },
    { english: "May I have some water?", translation: "Boleh saya minta air?" }
  ], [
    ["Which one is a drink?", "water", "rice", "banana", "Water is something we drink."],
    ["Complete: ‘I ___ noodles.’", "like", "likes", "am", "Use like with I."],
    ["How can you ask for water politely?", "May I have some water?", "Water now!", "Where water go?", "May I have… is a polite request."],
    ["Which food is a fruit?", "banana", "rice", "bread", "A banana is a fruit."],
    ["Opposite of hungry is…", "full", "thirsty", "tired", "Full means you have eaten enough."]
  ]),
  point(9, "local-culture", "Our Culture", "Local culture", "We can share local culture with visitors using simple, welcoming English and respectful explanations.", [
    { english: "Welcome to Bonjotan.", translation: "Selamat datang di Bonjotan." },
    { english: "This is a local tradition.", translation: "Ini tradisi setempat." }
  ], [
    ["How do you greet a visitor to Bonjotan?", "Welcome to Bonjotan!", "Leave Bonjotan!", "Where is Bonjotan?", "Welcome is a warm greeting for visitors."],
    ["Which word means ‘tradisi’?", "tradition", "direction", "conversation", "Tradition means tradisi."],
    ["Complete: ‘This is ___ local food.’", "a", "an", "are", "Use a before local food."],
    ["How can you invite someone to look?", "Please have a look.", "Do not see.", "Look yesterday.", "Please have a look is a polite invitation."],
    ["What word describes something from this area?", "local", "distant", "late", "Local means connected to this area."]
  ]),
  point(10, "friendly-visitors", "Be a Friendly Guide", "Friendly interaction", "A friendly guide listens, offers help, and uses short clear sentences with visitors.", [
    { english: "Can I help you?", translation: "Bisa saya bantu?" },
    { english: "Have a nice day!", translation: "Semoga harimu menyenangkan!" }
  ], [
    ["A visitor looks lost. What can you say?", "Can I help you?", "Do not ask me.", "I am a road.", "Can I help you? is a friendly offer."],
    ["How can you check understanding?", "Do you understand?", "Are you a place?", "Where understand?", "This question politely checks understanding."],
    ["You did not hear. What can you say?", "Could you repeat that, please?", "Never speak.", "Repeat yesterday.", "This politely asks someone to say it again."],
    ["What is a friendly goodbye?", "Have a nice day!", "Close the day!", "No more day!", "Have a nice day is a warm farewell."],
    ["Which sentence offers directions?", "I can show you the way.", "I can eat the way.", "The way is hungry.", "Show you the way means help someone find a place."]
  ])
];

