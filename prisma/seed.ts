import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo organizer (Bob)
  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      clerkId: "demo_clerk_id_bob",
      email: "bob@example.com",
      name: "Bob Sweigart",
      phone: "+15551234567",
      venmoHandle: "BobSweigart",
      hoodBucksBalance: 0,
    },
  });

  console.log("Created user:", bob.name);

  // Create the Big Bear trip
  const bigBearTrip = await prisma.trip.upsert({
    where: { inviteToken: "BIGBEAR2026" },
    update: {},
    create: {
      title: "Big Bear Adventure 2026",
      type: "CABIN",
      description: "Annual Big Bear cabin trip! Join us for skiing, games, wine tasting, and good times.",
      startDate: new Date("2026-04-09"),
      endDate: new Date("2026-04-12"),
      timezone: "America/Los_Angeles",
      address: "1651 Tuolumne Road",
      city: "Big Bear",
      state: "CA",
      country: "USA",
      latitude: 34.2423,
      longitude: -116.8957,
      airbnbConfirmationCode: "HMB4ZY39MF",
      airbnbUrl: "https://www.airbnb.com/rooms/123456",
      status: "CONFIRMED",
      organizerId: bob.id,
      inviteToken: "BIGBEAR2026",
      inviteTokenExpiry: new Date("2026-04-09"),
    },
  });

  console.log("Created trip:", bigBearTrip.title);

  // Create Bob as trip member (organizer)
  const bobMember = await prisma.tripMember.upsert({
    where: {
      tripId_guestEmail: {
        tripId: bigBearTrip.id,
        guestEmail: bob.email,
      },
    },
    update: {},
    create: {
      tripId: bigBearTrip.id,
      userId: bob.id,
      guestName: bob.name,
      guestEmail: bob.email,
      guestPhone: bob.phone,
      role: "ORGANIZER",
      rsvpStatus: "CONFIRMED",
      joinedAt: new Date(),
      hoodBucksBalance: 1000,
    },
  });

  // Demo guests
  const guests = [
    { name: "Alice Johnson", email: "alice@example.com", isCouple: true, couplePartnerName: "Alex" },
    { name: "Charlie Brown", email: "charlie@example.com", isCouple: false },
    { name: "Diana Prince", email: "diana@example.com", isCouple: true, couplePartnerName: "Steve" },
    { name: "Eddie Murphy", email: "eddie@example.com", isCouple: false },
    { name: "Fiona Apple", email: "fiona@example.com", isCouple: false, dietaryRestrictions: "Vegetarian" },
    { name: "George Clooney", email: "george@example.com", isCouple: true, couplePartnerName: "Amal" },
    { name: "Hannah Montana", email: "hannah@example.com", isCouple: false, allergies: "Gluten" },
    { name: "Ivan Drago", email: "ivan@example.com", isCouple: false },
  ];

  const createdMembers = [bobMember];

  for (const guest of guests) {
    const member = await prisma.tripMember.upsert({
      where: {
        tripId_guestEmail: {
          tripId: bigBearTrip.id,
          guestEmail: guest.email,
        },
      },
      update: {},
      create: {
        tripId: bigBearTrip.id,
        guestName: guest.name,
        guestEmail: guest.email,
        role: "GUEST",
        rsvpStatus: "CONFIRMED",
        isCouple: guest.isCouple,
        couplePartnerName: guest.couplePartnerName,
        dietaryRestrictions: guest.dietaryRestrictions,
        allergies: guest.allergies,
        joinedAt: new Date(),
        hoodBucksBalance: 1000,
      },
    });
    createdMembers.push(member);
    console.log("Created guest:", guest.name);
  }

  // Create itinerary days
  const days = [
    { date: new Date("2026-04-09"), title: "Arrival Day" },
    { date: new Date("2026-04-10"), title: "Day 2 - Skiing" },
    { date: new Date("2026-04-11"), title: "Day 3 - Wine Tasting" },
    { date: new Date("2026-04-12"), title: "Departure Day" },
  ];

  for (const day of days) {
    await prisma.itineraryDay.upsert({
      where: {
        tripId_date: {
          tripId: bigBearTrip.id,
          date: day.date,
        },
      },
      update: {},
      create: {
        tripId: bigBearTrip.id,
        date: day.date,
        title: day.title,
      },
    });
  }

  console.log("Created itinerary days");

  // Create meal nights (3 dinners)
  const meals = [
    {
      date: new Date("2026-04-09"),
      title: "Welcome Dinner",
      assignedTo: createdMembers[1], // Alice
    },
    {
      date: new Date("2026-04-10"),
      title: "Italian Night",
      assignedTo: createdMembers[3], // Diana
    },
    {
      date: new Date("2026-04-11"),
      title: "BBQ Night",
      assignedTo: createdMembers[5], // Fiona
    },
  ];

  for (const meal of meals) {
    await prisma.mealNight.upsert({
      where: {
        tripId_date_mealType: {
          tripId: bigBearTrip.id,
          date: meal.date,
          mealType: "DINNER",
        },
      },
      update: {},
      create: {
        tripId: bigBearTrip.id,
        date: meal.date,
        mealType: "DINNER",
        title: meal.title,
        assignedToMemberId: meal.assignedTo.id,
        assignedCoupleName: meal.assignedTo.isCouple
          ? `${meal.assignedTo.guestName} & ${meal.assignedTo.couplePartnerName}`
          : undefined,
        status: "ASSIGNED",
        servings: 11,
      },
    });
  }

  console.log("Created meal nights");

  // Create wine tasting event
  const wineEvent = await prisma.wineEvent.upsert({
    where: { id: "demo-wine-event-1" },
    update: {},
    create: {
      id: "demo-wine-event-1",
      tripId: bigBearTrip.id,
      title: "Big Bear Blind Wine Tasting 2026",
      date: new Date("2026-04-11T19:00:00"),
      status: "SETUP",
      priceRangeMin: 4,
      priceRangeMax: 40,
      bottleCount: 9,
      hoodBucksPotSize: 500,
      allowCashBets: true,
    },
  });

  console.log("Created wine event:", wineEvent.title);

  // Create wine entries (9 wines for 9 guests)
  const wines = [
    { name: "Caymus Cabernet Sauvignon", winery: "Caymus Vineyards", vintage: 2021, varietal: "Cabernet Sauvignon", price: 38 },
    { name: "Josh Cellars Merlot", winery: "Josh Cellars", vintage: 2022, varietal: "Merlot", price: 12 },
    { name: "Yellow Tail Shiraz", winery: "Yellow Tail", vintage: 2023, varietal: "Shiraz", price: 6 },
    { name: "Bread & Butter Pinot Noir", winery: "Bread & Butter", vintage: 2022, varietal: "Pinot Noir", price: 18 },
    { name: "19 Crimes Red Blend", winery: "19 Crimes", vintage: 2022, varietal: "Red Blend", price: 10 },
    { name: "Apothic Red", winery: "Apothic", vintage: 2022, varietal: "Red Blend", price: 9 },
    { name: "La Crema Chardonnay", winery: "La Crema", vintage: 2022, varietal: "Chardonnay", price: 22 },
    { name: "Kim Crawford Sauvignon Blanc", winery: "Kim Crawford", vintage: 2023, varietal: "Sauvignon Blanc", price: 14 },
    { name: "Meiomi Pinot Noir", winery: "Meiomi", vintage: 2022, varietal: "Pinot Noir", price: 20 },
  ];

  for (let i = 0; i < wines.length; i++) {
    await prisma.wineEntry.upsert({
      where: {
        wineEventId_bagNumber: {
          wineEventId: wineEvent.id,
          bagNumber: i + 1,
        },
      },
      update: {},
      create: {
        wineEventId: wineEvent.id,
        bagNumber: i + 1,
        wineName: wines[i].name,
        winery: wines[i].winery,
        vintage: wines[i].vintage,
        varietal: wines[i].varietal,
        price: wines[i].price,
        submittedByMemberId: createdMembers[i].id,
      },
    });
  }

  console.log("Created wine entries");

  // Create sample expenses
  const expenses = [
    { title: "Airbnb Rental", category: "ACCOMMODATION", amount: 1500, paidBy: bobMember },
    { title: "Groceries - Day 1", category: "GROCERIES", amount: 250, paidBy: createdMembers[1] },
    { title: "Gas for carpool", category: "GAS", amount: 80, paidBy: createdMembers[3] },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        tripId: bigBearTrip.id,
        title: expense.title,
        category: expense.category as "GROCERIES" | "GAS" | "DINING" | "ACTIVITIES" | "ACCOMMODATION" | "OTHER",
        amount: expense.amount,
        paidByMemberId: expense.paidBy.id,
        paidByUserId: expense.paidBy.userId,
        splitType: "EQUAL",
      },
    });
  }

  console.log("Created expenses");

  // Create packing list items
  const packingItems = [
    { category: "CLOTHING", name: "Warm jacket", forEveryone: true },
    { category: "CLOTHING", name: "Snow boots", forEveryone: true },
    { category: "GEAR", name: "Board games", quantity: 3 },
    { category: "GEAR", name: "Playing cards" },
    { category: "FOOD_AND_DRINKS", name: "Coffee", quantity: 2 },
    { category: "FOOD_AND_DRINKS", name: "Snacks", quantity: 5 },
    { category: "GEAR", name: "Bluetooth speaker" },
    { category: "FIRST_AID", name: "First aid kit" },
    { category: "TOILETRIES", name: "Sunscreen" },
    { category: "ENTERTAINMENT", name: "Wine glasses (set of 12)" },
    { category: "ENTERTAINMENT", name: "Paper bags for wine tasting", quantity: 12 },
  ];

  for (const item of packingItems) {
    await prisma.packingItem.create({
      data: {
        tripId: bigBearTrip.id,
        category: item.category as "CLOTHING" | "TOILETRIES" | "FOOD_AND_DRINKS" | "GEAR" | "ENTERTAINMENT" | "FIRST_AID" | "DOCUMENTS" | "ELECTRONICS" | "OTHER",
        name: item.name,
        quantity: item.quantity ?? 1,
        forEveryone: item.forEveryone ?? false,
      },
    });
  }

  console.log("Created packing items");

  // Create Hood Bucks transactions for initial grants
  for (const member of createdMembers) {
    await prisma.hoodBucksTransaction.create({
      data: {
        memberId: member.id,
        tripId: bigBearTrip.id,
        userId: member.userId,
        amount: 1000,
        type: "INITIAL_GRANT",
        description: "Welcome bonus for joining the trip",
      },
    });
  }

  console.log("Created Hood Bucks transactions");

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
