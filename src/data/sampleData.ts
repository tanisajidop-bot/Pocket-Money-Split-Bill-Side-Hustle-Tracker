import { AppState } from '../types';
import { getDaysAgoIso, getTodayIso } from '../utils/currency';

export function createSampleAppState(): AppState {
  const today = getTodayIso();

  return {
    theme: 'light',
    currency: 'PKR',
    budget: {
      monthlyAllowancePkr: 18000,
      dailyLimitPkr: 900,
    },
    friends: [
      { id: 'you', name: 'You' },
      { id: 'ayaan', name: 'Ayaan' },
      { id: 'zoya', name: 'Zoya' },
      { id: 'hamza', name: 'Hamza' },
      { id: 'sara', name: 'Sara' },
    ],
    expenses: [
      {
        id: 'exp-1',
        title: 'Iced Latte & Club Sandwich',
        amountPkr: 950,
        category: 'Food/Cafe',
        date: today,
      },
      {
        id: 'exp-2',
        title: 'InDrive Ride to Campus',
        amountPkr: 420,
        category: 'Transport/Ride',
        date: getDaysAgoIso(1),
      },
      {
        id: 'exp-3',
        title: 'Monthly Mobile Data Bundle',
        amountPkr: 1350,
        category: 'Data/Subscriptions',
        date: getDaysAgoIso(2),
      },
      {
        id: 'exp-4',
        title: 'Semester Course Pack Printing',
        amountPkr: 1100,
        category: 'Study/Printing',
        date: getDaysAgoIso(3),
      },
      {
        id: 'exp-5',
        title: 'Thrift Oversized Hoodie',
        amountPkr: 3400,
        category: 'Shopping',
        date: getDaysAgoIso(4),
      },
      {
        id: 'exp-6',
        title: 'Canteen Chai & Samosas',
        amountPkr: 480,
        category: 'Food/Cafe',
        date: getDaysAgoIso(5),
      },
      {
        id: 'exp-7',
        title: 'Cinema Ticket + Popcorn',
        amountPkr: 2250,
        category: 'Entertainment',
        date: getDaysAgoIso(6),
      },
      {
        id: 'exp-8',
        title: 'Spotify Student + Figma Pro',
        amountPkr: 1650,
        category: 'Data/Subscriptions',
        date: getDaysAgoIso(8),
      },
      {
        id: 'exp-9',
        title: 'Bike Fuel Top-up',
        amountPkr: 1400,
        category: 'Transport/Ride',
        date: getDaysAgoIso(9),
      },
      {
        id: 'exp-10',
        title: 'Biryani Lunch with Lab Group',
        amountPkr: 1850,
        category: 'Food/Cafe',
        date: getDaysAgoIso(11),
      },
    ],
    bills: [
      {
        id: 'bill-1',
        title: 'Late Night Shawarma & Fries',
        totalAmountPkr: 2400,
        tipOrTaxPkr: 150,
        payerId: 'you',
        splitMode: 'equal',
        date: getDaysAgoIso(1),
        shares: [
          { friendId: 'you', amountPkr: 850, settled: true },
          { friendId: 'ayaan', amountPkr: 850, settled: false },
          { friendId: 'hamza', amountPkr: 850, settled: false },
        ],
      },
      {
        id: 'bill-2',
        title: 'Group Cab from University',
        totalAmountPkr: 1350,
        tipOrTaxPkr: 0,
        payerId: 'zoya',
        splitMode: 'equal',
        date: getDaysAgoIso(3),
        shares: [
          { friendId: 'you', amountPkr: 450, settled: false },
          { friendId: 'zoya', amountPkr: 450, settled: true },
          { friendId: 'sara', amountPkr: 450, settled: false },
        ],
      },
      {
        id: 'bill-3',
        title: 'Bowling & Cold Drinks',
        totalAmountPkr: 3600,
        tipOrTaxPkr: 0,
        payerId: 'you',
        splitMode: 'equal',
        date: getDaysAgoIso(7),
        shares: [
          { friendId: 'you', amountPkr: 900, settled: true },
          { friendId: 'ayaan', amountPkr: 900, settled: true },
          { friendId: 'zoya', amountPkr: 900, settled: true },
          { friendId: 'sara', amountPkr: 900, settled: false },
        ],
      },
    ],
    hustles: [
      {
        id: 'hus-1',
        title: '3 Short-Form Reels Edit',
        client: 'TechPulse PK',
        stream: 'Video Editing',
        status: 'Paid',
        amountPkr: 7500,
        date: getDaysAgoIso(2),
      },
      {
        id: 'hus-2',
        title: 'Debate Society Poster Pack',
        client: 'Campus Arts Council',
        stream: 'Graphic Design',
        status: 'In Progress',
        amountPkr: 4500,
        date: today,
      },
      {
        id: 'hus-3',
        title: 'O-Level Math Prep Sessions',
        client: 'Bilal Tariq',
        stream: 'Tutoring',
        status: 'Paid',
        amountPkr: 6000,
        date: getDaysAgoIso(6),
      },
      {
        id: 'hus-4',
        title: 'Resold Vintage Denim Jacket',
        client: 'Insta Thrift Buyer',
        stream: 'Reselling',
        status: 'Pending',
        amountPkr: 3200,
        date: getDaysAgoIso(1),
      },
    ],
    checklist: [
      {
        id: 'chk-1',
        title: 'Pick one core money-making skill',
        description: 'Focus on Video Editing, Canva/Figma Design, Tutoring, or Reselling for 30 days.',
        completed: true,
      },
      {
        id: 'chk-2',
        title: 'Build 3 realistic sample works',
        description: 'Create 3 before/after demos or sample projects even before landing a paid client.',
        completed: true,
      },
      {
        id: 'chk-3',
        title: 'Set up a clean 1-page portfolio or profile',
        description: 'Add your samples, starting rates, and fast WhatsApp/email contact on Behance, LinkedIn, or Notion.',
        completed: true,
      },
      {
        id: 'chk-4',
        title: 'Pitch your first 10 prospects',
        description: 'Send personalized 3-line pitches with a relevant sample to local brands, creators, or student clubs.',
        completed: false,
      },
      {
        id: 'chk-5',
        title: 'Deliver fast & collect payment',
        description: 'Ship ahead of the deadline, request 50% upfront on custom gigs, and log the payout here.',
        completed: false,
      },
      {
        id: 'chk-6',
        title: 'Ask for 1 testimonial & 1 referral',
        description: 'Turn your first happy client into social proof and warm introductions.',
        completed: false,
      },
    ],
  };
}

export function createEmptyAppState(theme: 'light' | 'dark' = 'light', currency: 'PKR' | 'USD' = 'PKR'): AppState {
  return {
    theme,
    currency,
    budget: {
      monthlyAllowancePkr: 15000,
      dailyLimitPkr: null,
    },
    friends: [{ id: 'you', name: 'You' }],
    expenses: [],
    bills: [],
    hustles: [],
    checklist: createSampleAppState().checklist.map((item) => ({
      ...item,
      completed: false,
    })),
  };
}
