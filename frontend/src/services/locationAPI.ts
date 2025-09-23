// Location API service for Indian states, districts, and talukas
import axios from 'axios';

export interface State {
  id: number;
  name: string;
  code: string;
}

export interface District {
  id: number;
  name: string;
  stateId: number;
}

export interface Taluka {
  id: number;
  name: string;
  districtId: number;
}

// Indian States data
const INDIAN_STATES: State[] = [
  { id: 1, name: "Andhra Pradesh", code: "AP" },
  { id: 2, name: "Arunachal Pradesh", code: "AR" },
  { id: 3, name: "Assam", code: "AS" },
  { id: 4, name: "Bihar", code: "BR" },
  { id: 5, name: "Chhattisgarh", code: "CG" },
  { id: 6, name: "Goa", code: "GA" },
  { id: 7, name: "Gujarat", code: "GJ" },
  { id: 8, name: "Haryana", code: "HR" },
  { id: 9, name: "Himachal Pradesh", code: "HP" },
  { id: 10, name: "Jharkhand", code: "JH" },
  { id: 11, name: "Karnataka", code: "KA" },
  { id: 12, name: "Kerala", code: "KL" },
  { id: 13, name: "Madhya Pradesh", code: "MP" },
  { id: 14, name: "Maharashtra", code: "MH" },
  { id: 15, name: "Manipur", code: "MN" },
  { id: 16, name: "Meghalaya", code: "ML" },
  { id: 17, name: "Mizoram", code: "MZ" },
  { id: 18, name: "Nagaland", code: "NL" },
  { id: 19, name: "Odisha", code: "OR" },
  { id: 20, name: "Punjab", code: "PB" },
  { id: 21, name: "Rajasthan", code: "RJ" },
  { id: 22, name: "Sikkim", code: "SK" },
  { id: 23, name: "Tamil Nadu", code: "TN" },
  { id: 24, name: "Telangana", code: "TG" },
  { id: 25, name: "Tripura", code: "TR" },
  { id: 26, name: "Uttar Pradesh", code: "UP" },
  { id: 27, name: "Uttarakhand", code: "UK" },
  { id: 28, name: "West Bengal", code: "WB" },
  { id: 29, name: "Andaman and Nicobar Islands", code: "AN" },
  { id: 30, name: "Chandigarh", code: "CH" },
  { id: 31, name: "Dadra and Nagar Haveli and Daman and Diu", code: "DN" },
  { id: 32, name: "Delhi", code: "DL" },
  { id: 33, name: "Jammu and Kashmir", code: "JK" },
  { id: 34, name: "Ladakh", code: "LA" },
  { id: 35, name: "Lakshadweep", code: "LD" },
  { id: 36, name: "Puducherry", code: "PY" },
];

// Districts data - Comprehensive for Karnataka, sample for others
const DISTRICTS: District[] = [
  // Karnataka - All 31 districts
  { id: 11, name: "Bagalkot", stateId: 11 },
  { id: 12, name: "Ballari", stateId: 11 },
  { id: 13, name: "Belagavi", stateId: 11 },
  { id: 14, name: "Bengaluru Rural", stateId: 11 },
  { id: 15, name: "Bengaluru Urban", stateId: 11 },
  { id: 16, name: "Bidar", stateId: 11 },
  { id: 17, name: "Chamarajanagar", stateId: 11 },
  { id: 18, name: "Chikkaballapur", stateId: 11 },
  { id: 19, name: "Chikkamagaluru", stateId: 11 },
  { id: 20, name: "Chitradurga", stateId: 11 },
  { id: 21, name: "Dakshina Kannada", stateId: 11 },
  { id: 22, name: "Davanagere", stateId: 11 },
  { id: 23, name: "Dharwad", stateId: 11 },
  { id: 24, name: "Gadag", stateId: 11 },
  { id: 25, name: "Hassan", stateId: 11 },
  { id: 26, name: "Haveri", stateId: 11 },
  { id: 27, name: "Kalaburagi", stateId: 11 },
  { id: 28, name: "Kodagu", stateId: 11 },
  { id: 29, name: "Kolar", stateId: 11 },
  { id: 30, name: "Koppal", stateId: 11 },
  { id: 31, name: "Mandya", stateId: 11 },
  { id: 32, name: "Mysuru", stateId: 11 },
  { id: 33, name: "Raichur", stateId: 11 },
  { id: 34, name: "Ramanagara", stateId: 11 },
  { id: 35, name: "Shivamogga", stateId: 11 },
  { id: 36, name: "Tumakuru", stateId: 11 },
  { id: 37, name: "Udupi", stateId: 11 },
  { id: 38, name: "Uttara Kannada", stateId: 11 },
  { id: 39, name: "Vijayapura", stateId: 11 },
  { id: 40, name: "Yadgir", stateId: 11 },
  { id: 41, name: "Vijayanagara", stateId: 11 },
  
  // Sample districts for other states (for reference)
  // Maharashtra
  { id: 101, name: "Mumbai City", stateId: 14 },
  { id: 102, name: "Mumbai Suburban", stateId: 14 },
  { id: 103, name: "Pune", stateId: 14 },
  { id: 104, name: "Nashik", stateId: 14 },
  { id: 105, name: "Nagpur", stateId: 14 },
  
  // Tamil Nadu
  { id: 201, name: "Chennai", stateId: 23 },
  { id: 202, name: "Coimbatore", stateId: 23 },
  { id: 203, name: "Madurai", stateId: 23 },
  
  // Gujarat
  { id: 301, name: "Ahmedabad", stateId: 7 },
  { id: 302, name: "Surat", stateId: 7 },
  { id: 303, name: "Vadodara", stateId: 7 },
  
  // Delhi
  { id: 401, name: "Central Delhi", stateId: 32 },
  { id: 402, name: "North Delhi", stateId: 32 },
  { id: 403, name: "South Delhi", stateId: 32 },
];

// Talukas data - Comprehensive for Karnataka districts
const TALUKAS: Taluka[] = [
  // Bagalkot (id: 11)
  { id: 1001, name: "Badami", districtId: 11 },
  { id: 1002, name: "Bagalkot", districtId: 11 },
  { id: 1003, name: "Bilagi", districtId: 11 },
  { id: 1004, name: "Hunagund", districtId: 11 },
  { id: 1005, name: "Jamkhandi", districtId: 11 },
  { id: 1006, name: "Mudhol", districtId: 11 },
  
  // Ballari (id: 12)
  { id: 1101, name: "Ballari", districtId: 12 },
  { id: 1102, name: "Hadagalli", districtId: 12 },
  { id: 1103, name: "Hagaribommanahalli", districtId: 12 },
  { id: 1104, name: "Hospet", districtId: 12 },
  { id: 1105, name: "Kudligi", districtId: 12 },
  { id: 1106, name: "Sandur", districtId: 12 },
  { id: 1107, name: "Siruguppa", districtId: 12 },
  
  // Belagavi (id: 13)
  { id: 1201, name: "Athani", districtId: 13 },
  { id: 1202, name: "Bailhongal", districtId: 13 },
  { id: 1203, name: "Belagavi", districtId: 13 },
  { id: 1204, name: "Chikodi", districtId: 13 },
  { id: 1205, name: "Gokak", districtId: 13 },
  { id: 1206, name: "Hukkeri", districtId: 13 },
  { id: 1207, name: "Khanapur", districtId: 13 },
  { id: 1208, name: "Raibag", districtId: 13 },
  { id: 1209, name: "Ramadurg", districtId: 13 },
  { id: 1210, name: "Soundatti", districtId: 13 },
  
  // Bengaluru Rural (id: 14)
  { id: 1301, name: "Devanahalli", districtId: 14 },
  { id: 1302, name: "Doddaballapur", districtId: 14 },
  { id: 1303, name: "Hosakote", districtId: 14 },
  { id: 1304, name: "Nelamangala", districtId: 14 },
  
  // Bengaluru Urban (id: 15)
  { id: 1401, name: "Anekal", districtId: 15 },
  { id: 1402, name: "Bengaluru East", districtId: 15 },
  { id: 1403, name: "Bengaluru North", districtId: 15 },
  { id: 1404, name: "Bengaluru South", districtId: 15 },
  
  // Bidar (id: 16)
  { id: 1501, name: "Aurad", districtId: 16 },
  { id: 1502, name: "Basavakalyan", districtId: 16 },
  { id: 1503, name: "Bidar", districtId: 16 },
  { id: 1504, name: "Bhalki", districtId: 16 },
  { id: 1505, name: "Homnabad", districtId: 16 },
  
  // Chamarajanagar (id: 17)
  { id: 1601, name: "Chamarajanagar", districtId: 17 },
  { id: 1602, name: "Gundlupet", districtId: 17 },
  { id: 1603, name: "Kollegal", districtId: 17 },
  { id: 1604, name: "Yelandur", districtId: 17 },
  
  // Chikkaballapur (id: 18)
  { id: 1701, name: "Bagepalli", districtId: 18 },
  { id: 1702, name: "Chikkaballapur", districtId: 18 },
  { id: 1703, name: "Chintamani", districtId: 18 },
  { id: 1704, name: "Gauribidanur", districtId: 18 },
  { id: 1705, name: "Gudibande", districtId: 18 },
  { id: 1706, name: "Sidlaghatta", districtId: 18 },
  
  // Chikkamagaluru (id: 19)
  { id: 1801, name: "Ajjampura", districtId: 19 },
  { id: 1802, name: "Chikkamagaluru", districtId: 19 },
  { id: 1803, name: "Kadur", districtId: 19 },
  { id: 1804, name: "Kalasa", districtId: 19 },
  { id: 1805, name: "Koppa", districtId: 19 },
  { id: 1806, name: "Mudigere", districtId: 19 },
  { id: 1807, name: "Narasimharajapura", districtId: 19 },
  { id: 1808, name: "Sringeri", districtId: 19 },
  { id: 1809, name: "Tarikere", districtId: 19 },
  
  // Chitradurga (id: 20)
  { id: 1901, name: "Challakere", districtId: 20 },
  { id: 1902, name: "Chitradurga", districtId: 20 },
  { id: 1903, name: "Hiriyur", districtId: 20 },
  { id: 1904, name: "Holalkere", districtId: 20 },
  { id: 1905, name: "Hosadurga", districtId: 20 },
  { id: 1906, name: "Molakalmuru", districtId: 20 },
  
  // Dakshina Kannada (id: 21)
  { id: 2001, name: "Bantwal", districtId: 21 },
  { id: 2002, name: "Belthangady", districtId: 21 },
  { id: 2003, name: "Mangaluru", districtId: 21 },
  { id: 2004, name: "Puttur", districtId: 21 },
  { id: 2005, name: "Sullia", districtId: 21 },
  
  // Davanagere (id: 22)
  { id: 2101, name: "Channagiri", districtId: 22 },
  { id: 2102, name: "Davanagere", districtId: 22 },
  { id: 2103, name: "Harapanahalli", districtId: 22 },
  { id: 2104, name: "Harihar", districtId: 22 },
  { id: 2105, name: "Jagalur", districtId: 22 },
  { id: 2106, name: "Nyamati", districtId: 22 },
  
  // Dharwad (id: 23)
  { id: 2201, name: "Dharwad", districtId: 23 },
  { id: 2202, name: "Hubli", districtId: 23 },
  { id: 2203, name: "Kalghatgi", districtId: 23 },
  { id: 2204, name: "Kundgol", districtId: 23 },
  { id: 2205, name: "Navalgund", districtId: 23 },
  
  // Gadag (id: 24)
  { id: 2301, name: "Gadag", districtId: 24 },
  { id: 2302, name: "Lakshmeshwar", districtId: 24 },
  { id: 2303, name: "Mundargi", districtId: 24 },
  { id: 2304, name: "Nargund", districtId: 24 },
  { id: 2305, name: "Ron", districtId: 24 },
  { id: 2306, name: "Shirhatti", districtId: 24 },
  
  // Hassan (id: 25)
  { id: 2401, name: "Alur", districtId: 25 },
  { id: 2402, name: "Arkalgud", districtId: 25 },
  { id: 2403, name: "Arsikere", districtId: 25 },
  { id: 2404, name: "Belur", districtId: 25 },
  { id: 2405, name: "Channarayapatna", districtId: 25 },
  { id: 2406, name: "Hassan", districtId: 25 },
  { id: 2407, name: "Holenarasipur", districtId: 25 },
  { id: 2408, name: "Sakleshpur", districtId: 25 },
  
  // Haveri (id: 26)
  { id: 2501, name: "Byadgi", districtId: 26 },
  { id: 2502, name: "Hangal", districtId: 26 },
  { id: 2503, name: "Haveri", districtId: 26 },
  { id: 2504, name: "Hirekerur", districtId: 26 },
  { id: 2505, name: "Ranebennuru", districtId: 26 },
  { id: 2506, name: "Rattihalli", districtId: 26 },
  { id: 2507, name: "Savanur", districtId: 26 },
  { id: 2508, name: "Shiggaon", districtId: 26 },
  
  // Kalaburagi (id: 27)
  { id: 2601, name: "Afzalpur", districtId: 27 },
  { id: 2602, name: "Aland", districtId: 27 },
  { id: 2603, name: "Chincholi", districtId: 27 },
  { id: 2604, name: "Chitapur", districtId: 27 },
  { id: 2605, name: "Gulbarga", districtId: 27 },
  { id: 2606, name: "Jewargi", districtId: 27 },
  { id: 2607, name: "Kalaburagi", districtId: 27 },
  { id: 2608, name: "Sedam", districtId: 27 },
  
  // Kodagu (id: 28)
  { id: 2701, name: "Madikeri", districtId: 28 },
  { id: 2702, name: "Somwarpet", districtId: 28 },
  { id: 2703, name: "Virajpet", districtId: 28 },
  
  // Kolar (id: 29)
  { id: 2801, name: "Bangarpet", districtId: 29 },
  { id: 2802, name: "Kolar", districtId: 29 },
  { id: 2803, name: "Kolar Gold Fields", districtId: 29 },
  { id: 2804, name: "Malur", districtId: 29 },
  { id: 2805, name: "Mulbagal", districtId: 29 },
  { id: 2806, name: "Srinivaspur", districtId: 29 },
  
  // Koppal (id: 30)
  { id: 2901, name: "Gangavathi", districtId: 30 },
  { id: 2902, name: "Koppal", districtId: 30 },
  { id: 2903, name: "Kushtagi", districtId: 30 },
  { id: 2904, name: "Yelburga", districtId: 30 },
  
  // Mandya (id: 31)
  { id: 3001, name: "Krishnarajpet", districtId: 31 },
  { id: 3002, name: "Maddur", districtId: 31 },
  { id: 3003, name: "Malavalli", districtId: 31 },
  { id: 3004, name: "Mandya", districtId: 31 },
  { id: 3005, name: "Nagamangala", districtId: 31 },
  { id: 3006, name: "Pandavapura", districtId: 31 },
  { id: 3007, name: "Shrirangapattana", districtId: 31 },
  
  // Mysuru (id: 32)
  { id: 3101, name: "Hunsur", districtId: 32 },
  { id: 3102, name: "Krishnarajanagara", districtId: 32 },
  { id: 3103, name: "Mysuru", districtId: 32 },
  { id: 3104, name: "Nanjangud", districtId: 32 },
  { id: 3105, name: "Periyapatna", districtId: 32 },
  { id: 3106, name: "Saragur", districtId: 32 },
  { id: 3107, name: "Tirumakudalu Narsipur", districtId: 32 },
  
  // Raichur (id: 33)
  { id: 3201, name: "Devadurga", districtId: 33 },
  { id: 3202, name: "Lingsugur", districtId: 33 },
  { id: 3203, name: "Manvi", districtId: 33 },
  { id: 3204, name: "Raichur", districtId: 33 },
  { id: 3205, name: "Sindhnur", districtId: 33 },
  
  // Ramanagara (id: 34)
  { id: 3301, name: "Channapatna", districtId: 34 },
  { id: 3302, name: "Kanakapura", districtId: 34 },
  { id: 3303, name: "Magadi", districtId: 34 },
  { id: 3304, name: "Ramanagara", districtId: 34 },
  
  // Shivamogga (id: 35)
  { id: 3401, name: "Bhadravati", districtId: 35 },
  { id: 3402, name: "Hosanagar", districtId: 35 },
  { id: 3403, name: "Sagar", districtId: 35 },
  { id: 3404, name: "Shikaripur", districtId: 35 },
  { id: 3405, name: "Shimoga", districtId: 35 },
  { id: 3406, name: "Sorab", districtId: 35 },
  { id: 3407, name: "Thirthahalli", districtId: 35 },
  
  // Tumakuru (id: 36)
  { id: 3501, name: "Chikkanayakanahalli", districtId: 36 },
  { id: 3502, name: "Gubbi", districtId: 36 },
  { id: 3503, name: "Koratagere", districtId: 36 },
  { id: 3504, name: "Kunigal", districtId: 36 },
  { id: 3505, name: "Madhugiri", districtId: 36 },
  { id: 3506, name: "Pavagada", districtId: 36 },
  { id: 3507, name: "Sira", districtId: 36 },
  { id: 3508, name: "Tiptur", districtId: 36 },
  { id: 3509, name: "Tumakuru", districtId: 36 },
  { id: 3510, name: "Turuvekere", districtId: 36 },
  
  // Udupi (id: 37)
  { id: 3601, name: "Byndoor", districtId: 37 },
  { id: 3602, name: "Karkala", districtId: 37 },
  { id: 3603, name: "Kundapura", districtId: 37 },
  { id: 3604, name: "Udupi", districtId: 37 },
  
  // Uttara Kannada (id: 38)
  { id: 3701, name: "Ankola", districtId: 38 },
  { id: 3702, name: "Bhatkal", districtId: 38 },
  { id: 3703, name: "Haliyal", districtId: 38 },
  { id: 3704, name: "Honnavar", districtId: 38 },
  { id: 3705, name: "Joida", districtId: 38 },
  { id: 3706, name: "Karwar", districtId: 38 },
  { id: 3707, name: "Kumta", districtId: 38 },
  { id: 3708, name: "Mundgod", districtId: 38 },
  { id: 3709, name: "Siddapur", districtId: 38 },
  { id: 3710, name: "Sirsi", districtId: 38 },
  { id: 3711, name: "Yellapur", districtId: 38 },
  
  // Vijayapura (id: 39)
  { id: 3801, name: "Basavana Bagewadi", districtId: 39 },
  { id: 3802, name: "Bijapur", districtId: 39 },
  { id: 3803, name: "Chadachan", districtId: 39 },
  { id: 3804, name: "Indi", districtId: 39 },
  { id: 3805, name: "Muddebihal", districtId: 39 },
  { id: 3806, name: "Sindagi", districtId: 39 },
  { id: 3807, name: "Vijayapura", districtId: 39 },
  
  // Yadgir (id: 40)
  { id: 3901, name: "Gurmitkal", districtId: 40 },
  { id: 3902, name: "Shahapur", districtId: 40 },
  { id: 3903, name: "Shorapur", districtId: 40 },
  { id: 3904, name: "Surpur", districtId: 40 },
  { id: 3905, name: "Yadgir", districtId: 40 },
  
  // Vijayanagara (id: 41)
  { id: 4001, name: "Hagaribommanahalli", districtId: 41 },
  { id: 4002, name: "Hospet", districtId: 41 },
  { id: 4003, name: "Kottur", districtId: 41 },
  { id: 4004, name: "Kudligi", districtId: 41 },
  
  // Sample talukas for other states (when manually entered)
  // Mumbai City
  { id: 10001, name: "Mumbai City", districtId: 101 },
  { id: 10002, name: "Colaba", districtId: 101 },
  
  // Chennai
  { id: 20001, name: "Chennai North", districtId: 201 },
  { id: 20002, name: "Chennai South", districtId: 201 },
];

class LocationAPIService {
  // Get all states
  async getStates(): Promise<State[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return INDIAN_STATES;
  }

  // Get districts by state ID
  async getDistrictsByState(stateId: number): Promise<District[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return DISTRICTS.filter(district => district.stateId === stateId);
  }

  // Get talukas by district ID
  async getTalukasByDistrict(districtId: number): Promise<Taluka[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return TALUKAS.filter(taluka => taluka.districtId === districtId);
  }

  // Get state by ID
  async getStateById(id: number): Promise<State | null> {
    return INDIAN_STATES.find(state => state.id === id) || null;
  }

  // Get district by ID
  async getDistrictById(id: number): Promise<District | null> {
    return DISTRICTS.find(district => district.id === id) || null;
  }

  // Get taluka by ID
  async getTalukaById(id: number): Promise<Taluka | null> {
    return TALUKAS.find(taluka => taluka.id === id) || null;
  }

  // Search states by name
  async searchStates(query: string): Promise<State[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const lowerQuery = query.toLowerCase();
    return INDIAN_STATES.filter(state => 
      state.name.toLowerCase().includes(lowerQuery) ||
      state.code.toLowerCase().includes(lowerQuery)
    );
  }

  // Search districts by name within a state
  async searchDistricts(stateId: number, query: string): Promise<District[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const lowerQuery = query.toLowerCase();
    return DISTRICTS.filter(district => 
      district.stateId === stateId &&
      district.name.toLowerCase().includes(lowerQuery)
    );
  }

  // Search talukas by name within a district
  async searchTalukas(districtId: number, query: string): Promise<Taluka[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const lowerQuery = query.toLowerCase();
    return TALUKAS.filter(taluka => 
      taluka.districtId === districtId &&
      taluka.name.toLowerCase().includes(lowerQuery)
    );
  }
}

export const locationAPI = new LocationAPIService();
export default locationAPI;
