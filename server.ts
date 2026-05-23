import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Customer, ChatMessage } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize the Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini client successfully initialized.");
    } else {
      console.warn("WARNING: GEMINI_API_KEY is missing. System will operate in smart mock-AI mode.");
    }
  }
  return aiClient;
}

// -------------------------------------------------------------
// In-Memory Database for CRM, Memory and Mock Inventory
// -------------------------------------------------------------

// Interactive presets for Punjab / Chandigarh local businesses
const BUSINESS_PRESETS = {
  real_estate: {
    id: "real_estate" as const,
    name: "Punjab Elite Properties",
    location: "Sector 82, Mohali, Chandigarh",
    description: "Premium builder floor, plots, and flat deals in Zirakpur & Mohali (Airport Road).",
    catalog: [
      { item: "3 BHK Premium Flat", price: "₹85 Lakh", details: "Airport Road, Mohali. Modern layout, ready to move." },
      { item: "2 BHK Elegant Apartment", price: "₹58 Lakh", details: "Zirakpur, VIP Road. Gated society, club amenities." },
      { item: "Commercial Shop", price: "₹1.2 Crore", details: "High Street Market, Sector 79 Mohali. Good footfall." },
      { item: "Plot & Independent Floor", price: "₹95 Lakh", details: "Eco City, New Chandigarh. Green park facing." }
    ],
    faqs: [
      { q: "What are your prime development areas?", a: "We mainly deal in Mohali Airport Road, Zirakpur High Grounds, and New Chandigarh Mullanpur." },
      { q: "Is bank loan approval standard?", a: "Hanji sir, all our properties are approved by GMADA/RERA, and SBI, HDFC bank loans are easily available." },
      { q: "What is the site-visit timing?", a: "Sir we are active on all days including Sundays. Standard free pick & drop timings are 10 AM to 6 PM." }
    ]
  },
  solar: {
    id: "solar" as const,
    name: "Punjab Green Solar Systems",
    location: "Focal Point, Ludhiana / Chandigarh Industrial Area",
    description: "Leading residential & commercial solar setups with heavy Punjab state subidis (PM Surya Ghar).",
    catalog: [
      { item: "3kW Residential On-Grid", price: "₹1.4 Lakh", details: "Perfect for secondary homes, saves up to ₹2,500/month on electricity bills." },
      { item: "5kW Heavy Residential Solar", price: "₹2.2 Lakh", details: "Handles 2 ACs easily. Includes net-metering and state subsidy process." },
      { item: "10kW Commercial Hybrid System", price: "₹4.5 Lakh", details: "With battery backup, ideal for office complexes and small wheat mills in Punjab." }
    ],
    faqs: [
      { q: "Is Government Subsidy available in Punjab?", a: "Yes, sir! Under PM Surya Ghar Yojana, you can get up to ₹78,000 direct subsidy in Punjab on 3kW+ systems." },
      { q: "How long does it take to install and set up billing?", a: "Tusi bilkul fikar na karo! Standard installation takes 3 days, and net-metering approval takes 2-3 weeks from PSPCL." },
      { q: "AC operation on solar?", a: "A 5kW system is highly recommended. It runs 2 inverter ACs easily in daytime without grid power." }
    ]
  },
  visa: {
    id: "visa" as const,
    name: "Chandigarh Global Study Visa Specialists",
    location: "Sector 17, Chandigarh (opposite Fountain)",
    description: "Punjab's trustable consultants for Canada, UK, Australia Study visa, file processing & IELTS guidance.",
    catalog: [
      { item: "Canada Express Study Package", price: "₹45,000 fee", details: "Dual course choice, SDS file submission, GIC guidance, and high Success Rates." },
      { item: "IELTS & PTE Intensive Prep", price: "₹12,000/month", details: "Certified teachers, computer-based Mock examinations, study materials included." },
      { item: "UK / Australia Student Visa Intake", price: "₹35,000 fee", details: "Pre-CAS interviews preparation, financial verification assistance, spouse visa options." }
    ],
    faqs: [
      { q: "What is the minimum IELTS band required for Canada SDS?", a: "Sir, for SDS category, you need overall 6.0 bands with no section below 6.0." },
      { q: "Is gap years accepted for study visa?", a: "Yes, up to 4-5 years of genuine gap with valid experience proof is easily accepted for Canadian colleges." },
      { q: "When are the upcoming major intakes?", a: "Main intakes are September (Fall), January (Winter), and May (Spring). Apply 6 months in advance, sir." }
    ]
  }
};

// Seeding customer base
let CUSTOMERS_DB: Customer[] = [
  {
    id: "cust-98150",
    name: "Gurpreet Singh",
    phone: "98150 123456",
    language: "Punjabi",
    budget: "₹85 Lakh",
    interest: "3 BHK Mohali",
    lastIssue: "Site visit delay last Sunday",
    sentiment: "neutral" as const,
    leadScore: 78,
    priority: "high" as const,
    lastInteraction: "2026-05-23T10:00:00Z",
    history: [
      { id: "h1", sender: "customer" as const, text: "Sat Sri Akal, tusi Mohali airport road de flat dikha sakde ho?", timestamp: "2026-05-23T09:58:00Z" },
      { id: "h2", sender: "agent" as const, agentRole: "sales" as const, text: "Hanji Gurpreet paaji, sat sri akal! Bilkul sir, aasi Airport Road Mohali te VIP options ready rakhe ne. Budget approx kitna hai?", timestamp: "2026-05-23T09:59:00Z" },
      { id: "h3", sender: "customer" as const, text: "Budget 80-90 lakh tak hai par last Sunday site visit check karni si, par dubaara call hi nahi aaya tuhada.", timestamp: "2026-05-23T10:00:00Z" }
    ]
  },
  {
    id: "cust-94170",
    name: "Rahul Sharma",
    phone: "94170 987654",
    language: "Hinglish",
    budget: "₹2.2 Lakh",
    interest: "10kW Commercial Solar",
    lastIssue: "Billing confusion on net-meter",
    sentiment: "angry" as const,
    leadScore: 45,
    priority: "high" as const,
    lastInteraction: "2026-05-23T11:15:00Z",
    history: [
      { id: "s1", sender: "customer" as const, text: "Sir our solar Net Meter showing error. No backup calculation properly.", timestamp: "2026-05-23T11:14:00Z" },
      { id: "s2", sender: "agent" as const, agentRole: "support" as const, text: "Sir tell me your consumer ID, I can check local grid.", timestamp: "2026-05-23T11:14:30Z" },
      { id: "s3", sender: "customer" as const, text: "I have shared last week also! Customer team is highly unprofessional. Bill is still coming 10,000!", timestamp: "2026-05-23T11:15:00Z" }
    ]
  },
  {
    id: "cust-98720",
    name: "Amandeep Kaur",
    phone: "98720 334455",
    language: "English",
    budget: "₹45,000 fee",
    interest: "Canada SDS Study Visa",
    lastIssue: "IELTS result awaited",
    sentiment: "happy" as const,
    leadScore: 92,
    priority: "medium" as const,
    lastInteraction: "2026-05-23T12:30:00Z",
    history: [
      { id: "v1", sender: "customer" as const, text: "Hello, what colleges in Vancouver have September intake visa success rates good?", timestamp: "2026-05-23T12:28:00Z" },
      { id: "v2", sender: "agent" as const, agentRole: "sales" as const, text: "Hello ma'am! Vancouver Community College and Langara College are excellent choices. They have high success rates for Punjab students.", timestamp: "2026-05-23T12:29:00Z" },
      { id: "v3", sender: "customer" as const, text: "Great, will schedule a session to submit document files this Friday. Thank you!", timestamp: "2026-05-23T12:30:00Z" }
    ]
  },
  {
    id: "cust-94630",
    name: "Suresh Mehra",
    phone: "94630 112233",
    language: "Hinglish",
    budget: "₹58 Lakh",
    interest: "2 BHK Zirakpur",
    lastIssue: "None",
    sentiment: "vip" as const,
    leadScore: 95,
    priority: "high" as const,
    lastInteraction: "2026-05-23T14:45:00Z",
    history: [
      { id: "r1", sender: "customer" as const, text: "I am a NRI looking for a 2BHK rental investment flat in Zirakpur.", timestamp: "2026-05-23T14:40:00Z" },
      { id: "r2", sender: "agent" as const, agentRole: "sales" as const, text: "Welcome sir! NRI investors prefer VIP Road gated communities. They yield around ₹20,000/month rent. I will send you standard catalogs.", timestamp: "2026-05-23T14:44:00Z" },
      { id: "r3", sender: "customer" as const, text: "Please send full location video overview and details.", timestamp: "2026-05-23T14:45:00Z" }
    ]
  }
];

// Manager QA Analytics database
let ANALYTICS_DATA = {
  totalLeads: 124,
  convertedLeads: 42,
  activeTickets: 18,
  escalatedCount: 5,
  byLanguage: {
    "Hinglish": 54,
    "Punjabi": 45,
    "English": 18,
    "Hindi/Other": 7
  },
  bySentiment: {
    "happy": 32,
    "neutral": 65,
    "angry": 15,
    "vip": 12
  },
  industryMetrics: {
    "real_estate": 55,
    "solar": 38,
    "visa": 31
  },
  agentMetrics: [
    { name: "Router Agent (Brain)", callsHandled: 124, score: 98, satisfactionRate: 95, resolutions: 124, upsells: 0 },
    { name: "Sales Agent (Leads)", callsHandled: 66, score: 87, satisfactionRate: 85, resolutions: 30, upsells: 18 },
    { name: "Support Agent (Tech)", callsHandled: 42, score: 81, satisfactionRate: 79, resolutions: 32, upsells: 4 },
    { name: "Escalation Agent (VIP Care)", callsHandled: 16, score: 91, satisfactionRate: 88, resolutions: 12, upsells: 2 }
  ],
  recentReviewsByManager: [
    {
      id: "rev-1",
      customerName: "Gurpreet Singh",
      transcriptSnippet: "Customer was disappointed with rescheduled visit. Quick rescue was requested.",
      agentPerformance: "Sales agent missed prompt callback loop. Router successfully transferred when tone showed critical delay.",
      rating: 4,
      coachingAdvice: "Sales Agent must immediately follow up with custom free brochure via WhatsApp within 5 minutes of visit cancellation.",
      timestamp: "2026-05-23T10:15:00Z"
    },
    {
      id: "rev-2",
      customerName: "Rahul Sharma",
      transcriptSnippet: "Main complaint dalunga. Bill still high after installing solar panels.",
      agentPerformance: "Support Agent was speaking too technical. Escalation Agent saved it well with calming regional assurances of immediate inspection.",
      rating: 3,
      coachingAdvice: "Never repeat complex technical load schedules to billing conflict customers. Instead, acknowledge the reading delta, verify historical billing, and trigger site verification.",
      timestamp: "2026-05-23T11:30:00Z"
    }
  ]
};

// Helper to seed customer initial data if empty
function resetCRMSeed() {
  // Re-establish seed state
  CUSTOMERS_DB = [
    {
      id: "cust-98150",
      name: "Gurpreet Singh",
      phone: "98150 123456",
      language: "Punjabi",
      budget: "₹85 Lakh",
      interest: "3 BHK Mohali",
      lastIssue: "Site visit delay last Sunday",
      sentiment: "neutral",
      leadScore: 78,
      priority: "high",
      lastInteraction: new Date().toISOString(),
      history: [
        { id: "h1", sender: "customer", text: "Sat Sri Akal, tusi Mohali airport road de flat dikha sakde ho?", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: "h2", sender: "agent", agentRole: "sales", text: "Hanji Gurpreet paaji, sat sri akal! Bilkul sir, aasi Airport Road Mohali te VIP options ready rakhe ne. Budget approx kitna hai?", timestamp: new Date(Date.now() - 1800000).toISOString() },
        { id: "h3", sender: "customer", text: "Budget 80-90 lakh tak hai par last Sunday site visit check karni si, par dubaara call hi nahi aaya tuhada.", timestamp: new Date(Date.now() - 100000).toISOString() }
      ]
    },
    {
      id: "cust-94170",
      name: "Rahul Sharma",
      phone: "94170 987654",
      language: "Hinglish",
      budget: "₹2.2 Lakh",
      interest: "10kW Commercial Solar",
      lastIssue: "Billing confusion on net-meter",
      sentiment: "angry",
      leadScore: 45,
      priority: "high",
      lastInteraction: new Date().toISOString(),
      history: [
        { id: "s1", sender: "customer", text: "Sir our solar Net Meter showing error. No backup calculation properly.", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: "s2", sender: "agent", agentRole: "support", text: "Sir tell me your consumer ID, I can check local grid.", timestamp: new Date(Date.now() - 1800000).toISOString() },
        { id: "s3", sender: "customer", text: "I have shared last week also! Customer team is highly unprofessional. Bill is still coming 10,000!", timestamp: new Date(Date.now() - 200000).toISOString() }
      ]
    },
    {
      id: "cust-98720",
      name: "Amandeep Kaur",
      phone: "98720 334455",
      language: "English",
      budget: "₹45,000 fee",
      interest: "Canada SDS Study Visa",
      lastIssue: "IELTS result awaited",
      sentiment: "happy",
      leadScore: 92,
      priority: "medium",
      lastInteraction: new Date().toISOString(),
      history: [
        { id: "v1", sender: "customer", text: "Hello, what colleges in Vancouver have September intake visa success rates good?", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: "v2", sender: "agent", agentRole: "sales", text: "Hello ma'am! Vancouver Community College and Langara College are excellent choices. They have high success rates for Punjab students.", timestamp: new Date(Date.now() - 1800000).toISOString() },
        { id: "v3", sender: "customer", text: "Great, will schedule a session to submit document files this Friday. Thank you!", timestamp: new Date().toISOString() }
      ]
    },
    {
      id: "cust-94630",
      name: "Suresh Mehra",
      phone: "94630 112233",
      language: "Hinglish",
      budget: "₹58 Lakh",
      interest: "2 BHK Zirakpur",
      lastIssue: "None",
      sentiment: "vip",
      leadScore: 95,
      priority: "high",
      lastInteraction: new Date().toISOString(),
      history: [
        { id: "r1", sender: "customer", text: "I am a NRI looking for a 2BHK rental investment flat in Zirakpur.", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: "r2", sender: "agent", agentRole: "sales", text: "Welcome sir! NRI investors prefer VIP Road gated communities. They yield around ₹20,000/month rent. I will send you standard catalogs.", timestamp: new Date(Date.now() - 1800000).toISOString() },
        { id: "r3", sender: "customer", text: "Please send full location video overview and details.", timestamp: new Date(Date.now() - 500000).toISOString() }
      ]
    }
  ];

  ANALYTICS_DATA = {
    totalLeads: 124,
    convertedLeads: 42,
    activeTickets: 18,
    escalatedCount: 5,
    byLanguage: {
      "Hinglish": 54,
      "Punjabi": 45,
      "English": 18,
      "Hindi/Other": 7
    },
    bySentiment: {
      "happy": 32,
      "neutral": 65,
      "angry": 15,
      "vip": 12
    },
    industryMetrics: {
      "real_estate": 55,
      "solar": 38,
      "visa": 31
    },
    agentMetrics: [
      { name: "Router Agent (Brain)", callsHandled: 124, score: 98, satisfactionRate: 95, resolutions: 124, upsells: 0 },
      { name: "Sales Agent (Leads)", callsHandled: 66, score: 87, satisfactionRate: 85, resolutions: 30, upsells: 18 },
      { name: "Support Agent (Tech)", callsHandled: 42, score: 81, satisfactionRate: 79, resolutions: 32, upsells: 4 },
      { name: "Escalation Agent (VIP Care)", callsHandled: 16, score: 91, satisfactionRate: 88, resolutions: 12, upsells: 2 }
    ],
    recentReviewsByManager: [
      {
        id: "rev-1",
        customerName: "Gurpreet Singh",
        transcriptSnippet: "Customer was disappointed with rescheduled site visit. Quick rescue was requested.",
        agentPerformance: "Sales agent missed prompt callback loop. Router successfully transferred when tone showed critical delay.",
        rating: 4,
        coachingAdvice: "Sales Agent must immediately follow up with custom free brochure via WhatsApp within 5 minutes of visit cancellation.",
        timestamp: new Date(Date.now() - 36000000).toISOString()
      },
      {
        id: "rev-2",
        customerName: "Rahul Sharma",
        transcriptSnippet: "Main complaint dalunga. Bill still high after installing solar panels.",
        agentPerformance: "Support Agent was speaking too technical. Escalation Agent saved it well with calming regional assurances of immediate inspection.",
        rating: 3,
        coachingAdvice: "Never repeat complex technical load schedules to billing conflict customers. Instead, acknowledge the reading delta, verify historical billing, and trigger site verification.",
        timestamp: new Date(Date.now() - 18000000).toISOString()
      }
    ]
  };
}

// -------------------------------------------------------------
// AI Smart Simulators & Generative Prompts (Fallback fallback)
// -------------------------------------------------------------

// Local helper to parse Hinglish/Punjabi intents & sentiments if no Gemini Key
function getFallbackAIAnalysis(text: string, currentCust: any) {
  const content = text.toLowerCase();
  let intent: 'buy' | 'problem' | 'angry' | 'vip' | 'general' = 'general';
  let routedAgent: 'sales' | 'support' | 'escalation' | 'manager' = 'sales';
  let angerScore = 0.1;
  let language = "Hinglish";

  if (content.includes("sat sri akal") || content.includes("tusi") || content.includes("bhedo") || content.includes("kiyo")) {
    language = "Punjabi";
  } else if (content.includes("flat") || content.includes("solar") || content.includes("visa")) {
    language = "Hinglish";
  }

  // Detect critical issues / VIP status
  if (content.includes("nri") || content.includes("vip") || content.includes("director") || content.includes("investor")) {
    intent = 'vip';
    routedAgent = 'sales';
    angerScore = 0.0;
  }
  // Detect angry words
  else if (content.includes("fraud") || content.includes("complaint") || content.includes("gussa") || content.includes("social media") || content.includes("legal") || content.includes("unprofessional") || content.includes("delay") || content.includes("futtu") || content.includes("bakwas")) {
    intent = 'angry';
    routedAgent = 'escalation';
    angerScore = 0.85;
  }
  // Detect support queries
  else if (content.includes("cooling") || content.includes("repair") || content.includes("error") || content.includes("bill") || content.includes("meter") || content.includes("help") || content.includes("trouble") || content.includes("not working") || content.includes("work")) {
    intent = 'problem';
    routedAgent = 'support';
    angerScore = 0.2;
  }
  // Sales
  else if (content.includes("bhk") || content.includes("flat") || content.includes("plot") || content.includes("price") || content.includes("budget") || content.includes("rate") || content.includes("site visit") || content.includes("brochure") || content.includes("buy") || content.includes("cost") || content.includes("eligibility") || content.includes("ielts") || content.includes("canada") || content.includes("visa")) {
    intent = 'buy';
    routedAgent = 'sales';
    angerScore = 0.05;
  }

  // Extract variables
  const budgetMatch = text.match(/(\d+)\s*(lakh|crore|cr|k)/i);
  const budget = budgetMatch ? `₹${budgetMatch[1]} ${budgetMatch[2].toUpperCase()}` : (currentCust?.budget || "Unknown");

  let interest = currentCust?.interest || "General Query";
  if (content.includes("bhk")) {
    const bhkMatch = text.match(/(\d\s*bhk)/i);
    interest = bhkMatch ? bhkMatch[1].toUpperCase() + " " + (content.includes("mohali") ? "Mohali" : "Zirakpur") : "3 BHK Property";
  } else if (content.includes("solar")) {
    interest = content.includes("10kw") ? "10kW Solar" : "5kW Solar";
  } else if (content.includes("canada") || content.includes("visa") || content.includes("study")) {
    interest = "Canada SDS Study Visa";
  }

  return {
    customer_name: currentCust?.name || "New Client",
    language,
    budget,
    interest,
    last_issue: intent === 'angry' ? text : (currentCust?.lastIssue || "None"),
    sentiment: angerScore > 0.6 ? "angry" : (intent === 'vip' ? "vip" : "neutral"),
    lead_score: currentCust ? (intent === 'buy' ? Math.min(100, currentCust.leadScore + 10) : currentCust.leadScore) : 40,
    routedAgent,
    angerScore
  };
}

// Generate human-like Hinglish/Punjabi smart response based on catalog & agent role
function getFallbackAgentResponse(role: string, input: string, cust: any, preset: any): string {
  const name = cust?.name || "Sir/Ma'am";
  const catItems = preset.catalog.map((c: any) => `${c.item} for ${c.price}`).join(", ");
  const businessName = preset.name;

  if (role === "sales") {
    if (cust?.interest?.includes("Visa") || preset.id === "visa") {
      return `Sat Sri Akal ${name} ji! 🇨🇦 Main ${businessName} ton bol reha haan. Canada study visa de layi tusi bilkul sahi jagah aae ho. Sade kol September te January intake de master option ready ne. Tuhada IELTS ya PTE score kinna hai ji, ya tusi coaching check kar rahe ho?`;
    }
    if (cust?.interest?.includes("Solar") || preset.id === "solar") {
      return `Hanji ${name} Sir, namaskar! State Punjab Solar Agency valon standard 3kW te 5kW panels de utte dubaara subsidy start ho gayi hai. Tuhada monthly bill approximate kinna aunda hai, te ghar de load de hisaab nal run karna hai? Aasi pure Ludhiana te Chandigarh vich automatic PSPCL meter approve karwa ke dinde han!`;
    }
    // Real Estate default
    return `Sir Sat Sri Akal! ${name} ji, Airport road Mohali te Zirakpur de VIP locations te 3 BHK options ready state vich ne standard budget range de naal. Prime location near DPS te park face layouts available ne. Sir budget kinna coordinate rakhea hai tusi? Sunday free ho, aasi tuhadi free site visit coordinate karwa dayiye ji?`;
  }

  if (role === "support") {
    if (preset.id === "solar") {
      return `Ji ${name} ji, fikar na karo. Consumer net billing state coordinate check karwa lainde han line authority PSPCL ton. Kuch bar grid synchronization delay hunda hai. Please share details so our engineer Sarabjit Singh can call you in 15 mins for inspection.`;
    }
    if (preset.id === "visa") {
      return `Ji Ma'am, IELTS file registration status check kar lainde han dashboard te tracking system coordinate karke. SDS category file check ho gayi hai, visa processing time high success rate de naal check ho javega. Fikar na karo!`;
    }
    return `Ji ${name} ji, namaskar! Hum aapse continuous touch me hain. AC cooling issue or mechanical balance checking ke liye, aasi automatic professional booking status trigger kar rahe hain. Chandigarh or Mohali vich technician schedule Sunday 11 AM approve kara dinde han. Is this setup ok sir?`;
  }

  if (role === "escalation") {
    return `Hello ${name} ji, Sat Sri Akal, main Suhail bol raha hoon, Senior CRM Escalations ton. Sir, I sincerely apologize for the delay. Hum samajhte hain ki aapse site visit confirm hone par coordinate nahi kiya gaya/billing register correct nahi hua. Please don't worry! Main personally aapka folder lock kar raha hoon. Meri team se Senior Executive agle 10 minutes mein aapko hand-delivered priority solution dega. Please hold critical feedback, handle we will perfectly!`;
  }

  return `Sat Sri Akal ${name} ji! Welcome to ${businessName}. Chandigarh Support team is here. Main router AI, aapki lead coordinate kar chuka hoon. How may I help you today?`;
}


// --- REAL GEMINI ROUTER & EXECUTIVE EXECUTION ---

async function runGeminiMultiAgent(
  client: GoogleGenAI,
  message: string,
  currentCust: any,
  preset: any
) {
  try {
    // 1. ROUTER AGENT: Run intent detection and memory updates
    const routerPrompt = `
      You are the Router Agent (Brain) of a multi-agent AI support system for an Indian service business named "${preset.name}".
      The business type is "${preset.id}", located at "${preset.location}". Here is our brief description: "${preset.description}".

      Your job is to read the customer's text message, analyze their historical profile, and output metadata in perfectly structured JSON.

      Current Customer Context Profile from CRM Database:
      - Name: ${currentCust?.name || "Unknown"}
      - Current Language Preference: ${currentCust?.language || "Unknown"}
      - Logged Budget: ${currentCust?.budget || "Not Known"}
      - Interest/Product focus: ${currentCust?.interest || "Not Specified"}
      - Last active issue: ${currentCust?.lastIssue || "None"}
      - Prior Sentiment: ${currentCust?.sentiment || "neutral"}
      - Lead value score: ${currentCust?.leadScore || 50}

      New Incoming customer chat message:
      "${message}"

      Evaluate:
      1. ROUTING DECISION: Detect underlying intent and route to correct agent:
         - if anger is detected, VIP threat, or frustration, route to "escalation".
         - if it's a purchase/eligibility/pricing query or budget/site-visit ask, route to "sales".
         - if it is an operation issue, malfunction request, FAQ, tracking delay, or technician book, route to "support".
         - default fallback: "sales".
      2. SENTIMENT & ANGER: Detect sentiment ("neutral", "happy", "angry", "vip"). Output an anger score between 0.0 (perfectly happy) and 1.0 (screaming/legal threat).
      3. CUSTOMER DATA EXTRACT: Check if customer stated their name, budget, or distinct interest (e.g., 3 BHK flat, 5kW solar, Study visa canada) and update the memory fields.
      4. LEAD SCORE: Update the lead score (0 to 100) based on buying indicators (higher budget, asking for site visit, or serious academic plans raises score; angry complaint reduces score slightly, but high-interest angry can remain key).
      5. PRIORITY: "high" if anger_score > 0.6 or vip, "medium" if active sales lead, "low" for general faq.

      RESPOND ONLY with a JSON object matching this schema:
      {
        "customer_name": "string (updated if found in message, else preserve)",
        "language": "string (Hinglish, Punjabi, English, Hindi)",
        "budget": "string (extracted budget, e.g. '80 Lakh', or preserve)",
        "interest": "string (updated interest product like '3 BHK Mohali', solar kW, or preserve)",
        "last_issue": "string (if complaint detected, capture core complaint summary)",
        "sentiment": "happy/neutral/angry/vip",
        "lead_score": number (0-100),
        "angerScore": number (0.0 to 1.0),
        "routedAgent": "sales" | "support" | "escalation",
        "priority": "high" | "medium" | "low"
      }
    `;

    const routerResponse = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: routerPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    let routerLogs: any;
    try {
      routerLogs = JSON.parse(routerResponse.text?.trim() || "{}");
    } catch (e) {
      console.warn("JSON parse on router failed, using rule fallback.");
      routerLogs = getFallbackAIAnalysis(message, currentCust);
    }

    // 2. RUN SPECIFIC STREAMING/GENERATING AGENT: Sales, Support or Escalation
    const routedAgent = routerLogs.routedAgent || "sales";
    let agentRoleTitle = "Sales Consultant Specialist";
    let agentPersonaInstructions = "";

    if (routedAgent === "sales") {
      agentRoleTitle = "Sales Agent";
      agentPersonaInstructions = `
        You are "${preset.name}'s" star Sales Agent. You are a conversational champion focused on capturing high-quality leads, upselling, and relationship building.
        Your persona highlights:
        - Talk in friendly, enthusiastic regional tone. Punjabis love "hanji", "Sat Sri Akal", "paaji", "ma'am", "sir". Live up to that warmth!
        - Use a smart blend of Hinglish, English, and Punjabi. (Hinglish is primary, sprinkled with warm Punjabi phrases like "Aasi dubaara call coordinate karde han", "Fikar na karo").
        - Understand financial limits. Promptly guide EMI calculations (e.g. "sir, approx 8.2% interest rate te monthly installment standard aayegi").
        - Promote active catalogs of "${preset.name}" elegantly: ${JSON.stringify(preset.catalog)}.
        - Highlight unique site appointments ("Sunday, we have free car pick-and-drop for clients from Chandigarh sector 17, Mohali and Zirakpur!").
        - Gather missing details like contact info, budget limits, or target timeline naturally.
      `;
    } else if (routedAgent === "support") {
      agentRoleTitle = "Support Specialist";
      agentPersonaInstructions = `
        You are "${preset.name}'s" extremely polite, fast-acting Support Agent. Your purpose is resolving technical bugs or FAQ troubleshooting.
        Your persona highlights:
        - Direct, patient, technical but friendly. Speeds up troubleshooting using regional language ("Namaskar sir! Cooling issue hai? Main bilkul direct call center technician coordinate karva dinda han").
        - Grounded completely in the company's official knowledge base / FAQs: ${JSON.stringify(preset.faqs)}. Do not make up untrue guarantees.
        - Gently cross-sell warranty coverage or annual care plans (AMC packages) once the customer feels supported.
        - Highlight that manual status ticket is generated in CRM instantly. Ask customer to verify details if it's correct.
      `;
    } else {
      agentRoleTitle = "Escalation & VIP Manager";
      agentPersonaInstructions = `
        You are the senior-most Escalation Executive (handling VIPs and furious customers).
        Your persona highlights:
        - Speak with incredible calmness, empathy, and absolute accountability. 
        - Instantly address anger issues. Use soothing statements in regional languages ("Sincere apologies sir, main personally issue monitor kar raha hoon", "Gurpreet ji, sat sri akal, aasi kade vi customer da nuksaan nahi hon dinde").
        - Offer instant priorities: "Maine aapka case Executive Priority category me shift kar diya hai. Senior supervisor 10 mins me directly Call ya WhatsApp call karega."
        - Avoid technical debates or telling them they are wrong. Offer a compensatory token, quick service visit, or manual waiver immediately.
      `;
    }

    const agentPrompt = `
      Instructions:
      ${agentPersonaInstructions}

      Context information:
      - We are local industry: ${preset.id}
      - Customer Name: ${routerLogs.customer_name || "Client"}
      - Current Interest: ${routerLogs.interest || "Services"}
      - Current Budget: ${routerLogs.budget || "Not Specified"}
      - Anger Score: ${routerLogs.angerScore}
      - Historical chat messages: ${JSON.stringify(currentCust?.history || [])}
      - Recent message received: "${message}"

      Generate a natural, highly contextual response message representing "${agentRoleTitle}". Keep the response under 100 words. Speak like a real human agent working in Chandigarh/Mohali/Ludhiana. Respond in a mix of Hindi + Punjabi + English matching the customer's language. No robotic warnings or AI disclaimers!
    `;

    const agentResponse = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: agentPrompt,
      config: {
        temperature: 0.7,
      }
    });

    return {
      text: agentResponse.text?.trim() || "Sat Sri Akal! Connecting with agent.",
      routerLogs
    };

  } catch (err: any) {
    console.error("Gemini Multi-Agent execution failed. Falling back to rules.", err);
    const routerLogs = getFallbackAIAnalysis(message, currentCust);
    const text = getFallbackAgentResponse(routerLogs.routedAgent, message, currentCust, preset);
    return { text, routerLogs };
  }
}

// Generative TTS endpoint leveraging GEMINI 3.1 TTS
async function generateTTS(client: GoogleGenAI, text: string): Promise<string | null> {
  try {
    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say naturally, in a warm Indian professional voice: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }, // Puck/Kore are nice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err) {
    console.error("TTS generation failed or unsupported in this key tier. Skipping audio.", err);
    return null;
  }
}


// -------------------------------------------------------------
// REST API Core Routes
// -------------------------------------------------------------

// Presets
app.get("/api/crm/presets", (req, res) => {
  res.json(BUSINESS_PRESETS);
});

// Customers list
app.get("/api/crm/customers", (req, res) => {
  res.json(CUSTOMERS_DB);
});

// Reset CRM to initial seed
app.post("/api/crm/customers/reset", (req, res) => {
  resetCRMSeed();
  res.json({ status: "success", customers: CUSTOMERS_DB, analytics: ANALYTICS_DATA });
});

// Update Customer Memory
app.put("/api/crm/customers/:id", (req, res) => {
  const { id } = req.params;
  const index = CUSTOMERS_DB.findIndex(c => c.id === id);
  if (index !== -1) {
    CUSTOMERS_DB[index] = { ...CUSTOMERS_DB[index], ...req.body };
    res.json({ success: true, customer: CUSTOMERS_DB[index] });
  } else {
    res.status(404).json({ error: "Customer not found" });
  }
});

// -------------------------------------------------------------
// Calendar & Consultation Slot Planner Endpoints
// -------------------------------------------------------------

// Suggest optimal calendar slots based on customer history, last interaction date, and agent schedules
app.post("/api/crm/suggest-slots", (req, res) => {
  const { customerId } = req.body;
  const customer = CUSTOMERS_DB.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found for slot suggestions" });
  }

  // Parse customer interaction timestamp or fallback to current local time: 2026-05-23
  const lastInteractionDate = customer.lastInteraction ? new Date(customer.lastInteraction) : new Date("2026-05-23T21:46:28Z");
  
  // Calculate recommended dates relative to the last interaction date
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const slots: any[] = [];
  const sentiment = customer.sentiment;
  const interest = customer.interest.toLowerCase();

  // Determine standard assignee agent based on active sector & sentiment
  let primaryAgent = "Sanya Sharma (Senior Sales)";
  if (sentiment === "angry") {
    primaryAgent = "Suhail (Escalation Director)";
  } else if (interest.includes("solar")) {
    primaryAgent = "Sarabjit Singh (Solar Installation Tech)";
  } else if (interest.includes("visa") || interest.includes("ielts")) {
    primaryAgent = "Manpreet (Global Visa Expert)";
  }

  // 1. Slot A: The High-priority/Optimal Match Slot
  if (sentiment === "angry") {
    slots.push({
      id: "slot-emergency",
      isOptimal: true,
      confidenceScore: 99,
      date: formatDate(lastInteractionDate),
      time: "Within 15 Minutes (Emergency Call)",
      agentName: "Suhail (Escalation Director)",
      reason: "Immediate crisis-remedy callback to resolve delay complaints.",
      badge: "🔥 Emergency Priority"
    });
  } else if (interest.includes("solar")) {
    slots.push({
      id: "slot-solar-site",
      isOptimal: true,
      confidenceScore: 96,
      date: formatDate(addDays(lastInteractionDate, 1)),
      time: "11:00 AM - 12:30 PM",
      agentName: "Sarabjit Singh (Solar Installation Tech)",
      reason: "On-site solar feasibility survey & PM Surya Ghar state subsidy qualification assessment.",
      badge: "☀️ Recommended Survey"
    });
  } else if (interest.includes("visa") || interest.includes("ielts")) {
    slots.push({
      id: "slot-visa-consult",
      isOptimal: true,
      confidenceScore: 94,
      date: formatDate(addDays(lastInteractionDate, 2)),
      time: "02:30 PM - 03:30 PM",
      agentName: "Manpreet (Global Visa Expert)",
      reason: "Detailed 1-on-1 Canada Express Study Pathway & IELTS band deficit coaching setup.",
      badge: "🎓 Strategic Consult"
    });
  } else {
    slots.push({
      id: "slot-re-visit",
      isOptimal: true,
      confidenceScore: 98,
      date: formatDate(addDays(lastInteractionDate, 1)),
      time: "04:00 PM - 05:30 PM (Free Cab Pick-Up)",
      agentName: "Sanya Sharma (Senior Sales)",
      reason: "Free luxury car site-visit for ready builder floors in Mohali Airport Road.",
      badge: "🚗 Premium Site Tour"
    });
  }

  // 2. Slot B: Alternative Weekday Call Slot
  slots.push({
    id: "slot-followup",
    isOptimal: false,
    confidenceScore: 85,
    date: formatDate(addDays(lastInteractionDate, 3)),
    time: "10:30 AM - 11:15 AM",
    agentName: primaryAgent,
    reason: "Standard CRM phone follow-up to coordinate financial budget matching & loan approvals.",
    badge: "📞 Mid-Week Dialogue"
  });

  // 3. Slot C: Weekend VIP consultation or evening slot
  const isWeekend = lastInteractionDate.getDay() === 0 || lastInteractionDate.getDay() === 6;
  slots.push({
    id: "slot-evening-qa",
    isOptimal: false,
    confidenceScore: 78,
    date: formatDate(addDays(lastInteractionDate, isWeekend ? 5 : 7)),
    time: "06:30 PM - 07:15 PM",
    agentName: "Suhail (Escalation Director)",
    reason: "After-hours Manager Quality Assurance check & direct premium project briefing.",
    badge: "👑 VIP Evening Session"
  });

  res.json({
    lastInteraction: formatDate(lastInteractionDate),
    daysActiveThreshold: Math.max(0, Math.floor((Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))),
    slots
  });
});

// Book-appointment callback to persist schedule
app.post("/api/crm/schedule", (req, res) => {
  const { customerId, date, time, agentName, reason } = req.body;
  const customer = CUSTOMERS_DB.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  customer.appointment = {
    date,
    time,
    status: "confirmed",
    agentName,
    reason
  };

  const sysMsgId = `sys-${Date.now()}-sched`;
  const systemMessage: ChatMessage = {
    id: sysMsgId,
    sender: "system",
    text: `📅 Scheduled ${reason} with ${agentName} on ${date} at ${time}. Status: CONFIRMED.`,
    timestamp: new Date().toISOString()
  };
  customer.history.push(systemMessage);

  customer.leadScore = Math.min(100, customer.leadScore + 15);
  if (customer.sentiment === "angry") {
    customer.sentiment = "neutral";
    customer.priority = "medium";
  }

  ANALYTICS_DATA.activeTickets = Math.max(0, ANALYTICS_DATA.activeTickets - 1);
  ANALYTICS_DATA.convertedLeads += 1;

  // Bump agent resolution rating
  const metricIndex = ANALYTICS_DATA.agentMetrics.findIndex(a => agentName.toLowerCase().includes(a.name.split(" ")[0].toLowerCase()));
  if (metricIndex !== -1) {
    ANALYTICS_DATA.agentMetrics[metricIndex].resolutions += 1;
    ANALYTICS_DATA.agentMetrics[metricIndex].score = Math.min(100, ANALYTICS_DATA.agentMetrics[metricIndex].score + 2);
  }

  res.json({
    success: true,
    customer,
    appointment: customer.appointment,
    analytics: ANALYTICS_DATA
  });
});

// Multi-Agent chat router endpoint
app.post("/api/agent/chat", async (req, res) => {
  const { message, customerPhone, industry, voiceInput, fallbackTTS } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Find or create customer
  const phoneNormalized = customerPhone || "99999 00000";
  let customer = CUSTOMERS_DB.find(c => c.phone.replace(/\s+/g, '') === phoneNormalized.replace(/\s+/g, ''));

  if (!customer) {
    // Create new client on-the-fly
    customer = {
      id: `cust-${Math.floor(10000 + Math.random() * 90000)}`,
      name: "New Guest",
      phone: phoneNormalized,
      language: "Hinglish",
      budget: "Unknown",
      interest: "General",
      lastIssue: "None",
      sentiment: "neutral",
      leadScore: 30,
      priority: "medium",
      lastInteraction: new Date().toISOString(),
      history: []
    };
    CUSTOMERS_DB.push(customer);
    ANALYTICS_DATA.totalLeads += 1;
  }

  // Build history entry
  const userMsgId = `msg-${Date.now()}-user`;
  const userMsg: ChatMessage = {
    id: userMsgId,
    sender: "customer",
    text: message,
    timestamp: new Date().toISOString(),
    isVoice: !!voiceInput
  };
  customer.history.push(userMsg);

  // Invoke CRM Agents
  const gemini = getGeminiClient();
  const currentIndustryPreset = BUSINESS_PRESETS[industry as keyof typeof BUSINESS_PRESETS] || BUSINESS_PRESETS.real_estate;

  let result;
  if (gemini) {
    result = await runGeminiMultiAgent(gemini, message, customer, currentIndustryPreset);
  } else {
    // Falls back to rules
    const logs = getFallbackAIAnalysis(message, customer);
    const textOut = getFallbackAgentResponse(logs.routedAgent, message, customer, currentIndustryPreset);
    result = { text: textOut, routerLogs: logs };
  }

  const { text, routerLogs } = result;

  // Sync back Router memory modifications in real-time
  customer.name = routerLogs.customer_name || customer.name;
  customer.language = routerLogs.language || customer.language;
  customer.budget = routerLogs.budget || customer.budget;
  customer.interest = routerLogs.interest || customer.interest;
  customer.lastIssue = routerLogs.last_issue || customer.lastIssue;
  customer.sentiment = routerLogs.sentiment || customer.sentiment;
  customer.leadScore = routerLogs.lead_score || customer.leadScore;
  customer.priority = routerLogs.priority || customer.priority;
  customer.lastInteraction = new Date().toISOString();

  // Create Agent Response message
  const agentMsgId = `msg-${Date.now()}-agent`;
  const agentMsg: ChatMessage = {
    id: agentMsgId,
    sender: "agent",
    agentRole: routerLogs.routedAgent,
    text: text,
    timestamp: new Date().toISOString()
  };
  customer.history.push(agentMsg);

  // Update CRM dashboard-wide metrics dynamically based on changes
  const happyCount = CUSTOMERS_DB.filter(c => c.sentiment === 'happy').length;
  const neutralCount = CUSTOMERS_DB.filter(c => c.sentiment === 'neutral').length;
  const angryCount = CUSTOMERS_DB.filter(c => c.sentiment === 'angry').length;
  const vipCount = CUSTOMERS_DB.filter(c => c.sentiment === 'vip').length;

  ANALYTICS_DATA.bySentiment = {
    happy: happyCount + 20,
    neutral: neutralCount + 50,
    angry: angryCount + 10,
    vip: vipCount + 8
  };

  if (routerLogs.routedAgent === "escalation") {
    ANALYTICS_DATA.escalatedCount = CUSTOMERS_DB.filter(c => c.sentiment === 'angry').length;
  }

  // Adjust language breakdown
  const langUpper = routerLogs.language;
  if (langUpper && ANALYTICS_DATA.byLanguage[langUpper] !== undefined) {
    ANALYTICS_DATA.byLanguage[langUpper] += 1;
  }

  // Keep tally on agent workloads
  const metricIndex = ANALYTICS_DATA.agentMetrics.findIndex(a => a.name.toLowerCase().includes(routerLogs.routedAgent));
  if (metricIndex !== -1) {
    ANALYTICS_DATA.agentMetrics[metricIndex].callsHandled += 1;
    if (routerLogs.routedAgent === "sales" && routerLogs.lead_score > 75) {
      ANALYTICS_DATA.agentMetrics[metricIndex].upsells += 1;
    }
  }
  ANALYTICS_DATA.agentMetrics[0].callsHandled += 1; // router handled all

  // Generate real audio if requested & Gemini is active
  let audioBase64: string | null = null;
  if (fallbackTTS && gemini) {
    audioBase64 = await generateTTS(gemini, text);
  }

  res.json({
    message: agentMsg,
    routerLogs,
    customer,
    audioBase64
  });
});

// Trigger Manager QA Review & Coaching
app.post("/api/manager/evaluate", async (req, res) => {
  const { customerId, industryPreset } = req.body;
  const customer = CUSTOMERS_DB.find(c => c.id === customerId);

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const preset = BUSINESS_PRESETS[industryPreset as keyof typeof BUSINESS_PRESETS] || BUSINESS_PRESETS.real_estate;
  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const managerPrompt = `
        You are the General Manager Agent of "${preset.name}", looking at the customer interaction transcript of customer "${customer.name}".
        The customer's details are:
        - Interest: ${customer.interest}
        - Current Sentiment: ${customer.sentiment}
        - Lead Score: ${customer.leadScore}
        - Last interaction topic: ${customer.lastIssue}

        Here is their conversation history:
        ${JSON.stringify(customer.history)}

        Perform a high-level Quality Assurance (QA) audit.
        Evaluate:
        1. Rate the overall agent performance out of 5 stars (number from 1 to 5).
        2. Identify specific successes/misses by the Sales, Support, or Escalation agent.
        3. Give 1 direct practical advice coaching guideline for the human agent team to follow up.
        4. Synthesize a 1-sentence transcript summary.

        You MUST respond only in valid JSON matching this schema:
        {
          "rating": number (1 to 5),
          "agentPerformance": "string description",
          "coachingAdvice": "string description of coaching suggestions",
          "transcriptSnippet": "string sentence summary"
        }
      `;

      const managerResponse = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: managerPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const parsed = JSON.parse(managerResponse.text?.trim() || "{}");
      const newReview = {
        id: `rev-${Date.now()}`,
        customerName: customer.name,
        transcriptSnippet: parsed.transcriptSnippet || `Reviewed conversation history for customer ${customer.name}.`,
        agentPerformance: parsed.agentPerformance || "Standard professional dialogue handling.",
        rating: parsed.rating || 4,
        coachingAdvice: parsed.coachingAdvice || "Keep up-to-date regional references and response timeline under 10 seconds.",
        timestamp: new Date().toISOString()
      };

      ANALYTICS_DATA.recentReviewsByManager.unshift(newReview);
      res.json(newReview);
    } catch (err) {
      console.error("Manager review generation failed. Using default report.", err);
      // fallback
    }
  }

  // Mock standard callback fallback if gemini key is empty/error
  const mockReview = {
    id: `rev-${Date.now()}`,
    customerName: customer.name,
    transcriptSnippet: `Simulated backup review on ${customer.name}'s query about ${customer.interest}.`,
    agentPerformance: customer.sentiment === 'angry'
      ? "Router routed successfully; Escalation saved the hot complaint. Conversational warming worked."
      : "Excellent Hinglish negotiation. Lead score bumped up to " + customer.leadScore,
    rating: customer.sentiment === 'angry' ? 4 : 5,
    coachingAdvice: customer.sentiment === 'angry'
      ? "Always double-check dispatch times with technician Sarabjit Singh to avoid repeat complaints."
      : "Schedule the site visit call promptly on Saturday morning around 11:00 AM.",
    timestamp: new Date().toISOString()
  };

  ANALYTICS_DATA.recentReviewsByManager.unshift(mockReview);
  res.json(mockReview);
});

// Analytics fetch
app.get("/api/crm/analytics", (req, res) => {
  res.json(ANALYTICS_DATA);
});


// -------------------------------------------------------------
// Vite Dev Server / Static Hosting Integration
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // Production client bundle static hosting
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static file serving configured from", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Multi-Agent Support app running at http://localhost:${PORT}`);
  });
}

// Global seed on start
resetCRMSeed();

startServer();
