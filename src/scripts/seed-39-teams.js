require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Team = require('../models/Team');
const Batch = require('../models/Batch');
const College = require('../models/College');
const { sendTLCredentials } = require('../services/mail.service');

const TEAMS_DATA = [
  {
    num: "01",
    teamName: "Runtime Rebels.....🏃♂️",
    leadUsername: "Team_01",
    leadName: "KISANNAGARI SHASHANK",
    usn: "23691a05j9",
    room: "322",
    mobile: "6305524083",
    email: "shashankdany8712@gmail.com",
    dept: "CSE C",
    members: [
      { name: "Y N SAGAR", rollNumber: "23691a05h7", roomNumber: "322", mobile: "6305528820", email: "sagar630180@gmail.com", dept: "CSE C" },
      { name: "G SANTHOSH", rollNumber: "23691a05j4", roomNumber: "322", mobile: "9985226873", email: "santhoshsunny2005@gmail.com", dept: "CSE C" },
      { name: "D SAI UPENDRA REDDY", rollNumber: "23691A05I6", roomNumber: "322", mobile: "9121442189", email: "sai8591702@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "02",
    teamName: "Team 02",
    leadUsername: "Team_02",
    leadName: "o .santosh kumar",
    usn: "23691a05j5",
    room: "322",
    mobile: "9392795964",
    email: "Santoshcontact999@gmail.com",
    dept: "CSE C",
    members: [
      { name: "shaik razak", rollNumber: "23691a05g3", roomNumber: "322", mobile: "7032952088", email: "shaik.razak756@gmail.com", dept: "CSE C" },
      { name: "mani bhushan", rollNumber: "23691a05g6", roomNumber: "322", mobile: "7981776723", email: "manibhushan.contact@gmail.com", dept: "CSE C" },
      { name: "R Reddi vijay", rollNumber: "23691A05G4", roomNumber: "322", mobile: "9182468066", email: "vijayramisetty8@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "03",
    teamName: "Team 03",
    leadUsername: "Team_03",
    leadName: "K.Udaykrian",
    usn: "23691A05M8",
    room: "322",
    mobile: "9493727812",
    email: "Udaykiran.k146@gmail.com",
    dept: "CSE D",
    members: [
      { name: "T.SivaGanesh", rollNumber: "23691A05K6", roomNumber: "322", mobile: "8688250551", email: "thangellasivaganesh01@gmail.com", dept: "CSE D" },
      { name: "N.Vamsi", rollNumber: "23691A05N5", roomNumber: "322", mobile: "9014006731", email: "vamsinukanaboina@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "04",
    teamName: "Coding Cats",
    leadUsername: "Team_04",
    leadName: "N.Silpa",
    usn: "23691A05K3",
    room: "322",
    mobile: "6302036589",
    email: "silpanallapareddy@gmail.com",
    dept: "CSE D",
    members: [
      { name: "K.ShreyaSri", rollNumber: "23691A05L3", roomNumber: "322", mobile: "9391141447", email: "khamillasreyasri@gmail.com", dept: "CSE D" },
      { name: "M.Shwethanjali", rollNumber: "23691A05K2", roomNumber: "322", mobile: "8977276004", email: "anjalishwetha900@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "05",
    teamName: "Team 05",
    leadUsername: "Team_05",
    leadName: "p.tejesh",
    usn: "N/A",
    room: "203",
    mobile: "7780234468",
    email: "tejeshpodali926@gmail.com",
    dept: "CSE",
    members: []
  },
  {
    num: "06",
    teamName: "Debug Divas",
    leadUsername: "Team_06",
    leadName: "K Sai Prasuna",
    usn: "23691A05I5",
    room: "322",
    mobile: "9347273641",
    email: "kalumurisaiprasuna2005@gmail.com",
    dept: "CSE C",
    members: [
      { name: "P Thaheera", rollNumber: "23691A05M2", roomNumber: "322", mobile: "8639294997", email: "thaheera2516@gmail.com", dept: "CSE D" },
      { name: "K Sana Farhath", rollNumber: "23691A05I9", roomNumber: "322", mobile: "6301246088", email: "sanafarahathkasala@gmail.com", dept: "CSE C" },
      { name: "P Yesteba", rollNumber: "24695A0525", roomNumber: "322", mobile: "9346203737", email: "poolayesteba@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "07",
    teamName: "Halal Warriors",
    leadUsername: "Team_07",
    leadName: "V.V.S Pavan Kumar",
    usn: "23691A05I3",
    room: "322",
    mobile: "7670994497",
    email: "pavanvedasistla@gmail.com",
    dept: "CSE C",
    members: [
      { name: "M M Sai Ganesh", rollNumber: "23691A05H9", roomNumber: "322", mobile: "7780412316", email: "saiganesh40594@gmail.com", dept: "CSE C" },
      { name: "G Koushik", rollNumber: "23691A0587", roomNumber: "203", mobile: "7981592251", email: "koushikgopavaram9@gmail.com", dept: "CSE B" }
    ]
  },
  {
    num: "08",
    teamName: "CATALYST",
    leadUsername: "Team_08",
    leadName: "saif khan",
    usn: "23691A05I7",
    room: "322",
    mobile: "7893217520",
    email: "mpl.saif434@gmail.com",
    dept: "CSE C",
    members: [
      { name: "Patnam Shaik Sonusajith", rollNumber: "24695A0525", roomNumber: "322", mobile: "7993108653", email: "sonusajith02@gmail.com", dept: "CSE C" },
      { name: "B.mohammed Roshan", rollNumber: "23691A05H2", roomNumber: "322", mobile: "8374203285", email: "roshannanu471@gmail.com", dept: "CSE C" },
      { name: "G Rohith kumar", rollNumber: "23691A05H1", roomNumber: "322", mobile: "6300679794", email: "rohit06717@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "09",
    teamName: "Team 09",
    leadUsername: "Team_09",
    leadName: "S.Surekha",
    usn: "24695A3215",
    room: "203",
    mobile: "8790832492",
    email: "surekhasunkara45@gmail.com",
    dept: "DS C",
    members: [
      { name: "N.Sunaishmitha", rollNumber: "24695A3214", roomNumber: "203", mobile: "7416825479", email: "sunaishmithan@gmail.com", dept: "DS B" },
      { name: "P.Venkata Akhila", rollNumber: "23691A32I1", roomNumber: "203", mobile: "6303361916", email: "pagundlaakhi@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "10",
    teamName: "GenZ Developers",
    leadUsername: "Team_10",
    leadName: "K.yaswanth reddy",
    usn: "23691A05Q4",
    room: "322",
    mobile: "8897508310",
    email: "kovvuruyaswanthreddy@gmail.com",
    dept: "CSE D",
    members: [
      { name: "P.vineeth sai", rollNumber: "23691A05O2", roomNumber: "322", mobile: "8341491639", email: "vineeth.padam@gmail.com", dept: "CSE D" },
      { name: "venu gopal", rollNumber: "23691A05O5", roomNumber: "322", mobile: "6305205099", email: "venumanikinda@gmail.com", dept: "CSE D" },
      { name: "U.Yashaswini", rollNumber: "23691A05Q3", roomNumber: "322", mobile: "8019808305", email: "yashaswiniy883@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "11",
    teamName: "Team 11",
    leadUsername: "Team_11",
    leadName: "Sadiya Tabasum",
    usn: "23691A05H6",
    room: "322",
    mobile: "8885342085",
    email: "sadiyatabasums786@gmail.com",
    dept: "CSE C",
    members: [
      { name: "Sanobar Sulthana", rollNumber: "23691A05J3", roomNumber: "322", mobile: "7989191636", email: "shaiksulthana7861@gmail.com", dept: "CSE C" },
      { name: "Reshmitha", rollNumber: "23691A05H0", roomNumber: "203", mobile: "6303282655", email: "reshmithapotthuru@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "12",
    teamName: "Team 12",
    leadUsername: "Team_12",
    leadName: "Sana Anjum",
    usn: "23691A05I8",
    room: "322",
    mobile: "7702616300",
    email: "pathansanaanjum14@gmail.com",
    dept: "CSE C",
    members: [
      { name: "Sadeefa Sulthana", rollNumber: "23691A05H5", roomNumber: "322", mobile: "9346857657", email: "syedsadeefa06@gmail.com", dept: "CSE C" },
      { name: "Sathvika", rollNumber: "23691A05J8", roomNumber: "322", mobile: "9381780274", email: "kurapatisathvika09@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "13",
    teamName: "Team 13",
    leadUsername: "Team_13",
    leadName: "a. yashwanth",
    usn: "24695a0524",
    room: "203",
    mobile: "9059709127",
    email: "akulayashwanth278@gmail.com",
    dept: "CSE D",
    members: [
      { name: "k.siva prasad", rollNumber: "23691a05k7", roomNumber: "322", mobile: "8247588599", email: "ksivaprasad032@gmail.com", dept: "CSE D" },
      { name: "b.tharun", rollNumber: "23691a05m5", roomNumber: "322", mobile: "7794833058", email: "banditharun2428@gmail.com", dept: "CSE D" },
      { name: "k.uday sankar", rollNumber: "23691a05m9", roomNumber: "322", mobile: "8179893267", email: "udaysankar2005@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "14",
    teamName: "Team 14",
    leadUsername: "Team_14",
    leadName: "Poreddy Sruthi",
    usn: "23691A32F2",
    room: "203",
    mobile: "9014193724",
    email: "poreddysruthi2006@gmail.com",
    dept: "DS C",
    members: [
      { name: "Bogireddy Usha Rani", rollNumber: "23691A32H1", roomNumber: "203", mobile: "9849294698", email: "usharanibogireddy@gmail.com", dept: "DS C" },
      { name: "Pagadala Thanuja", rollNumber: "23691A32G3", roomNumber: "203", mobile: "8978109009", email: "pagadalathanuja@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "15",
    teamName: "Team 15",
    leadUsername: "Team_15",
    leadName: "S.Arfiya Anjum",
    usn: "23691A0514",
    room: "203",
    mobile: "7569501337",
    email: "shaikarfiyaanjum@gmail.com",
    dept: "CSE A",
    members: [
      { name: "G.Ayesha", rollNumber: "23691A0518", roomNumber: "203", mobile: "9063922989", email: "ayeshagudimetla@gmail.com", dept: "CSE A" },
      { name: "P.Gnana Prasuna", rollNumber: "23691A0546", roomNumber: "203", mobile: "6305154981", email: "gnanaprasuna612@gmail.com", dept: "CSE A" },
      { name: "G.Hemalatha", rollNumber: "23691A0565", roomNumber: "203", mobile: "6305450969", email: "hema42426@gmail.com", dept: "CSE A" }
    ]
  },
  {
    num: "16",
    teamName: "Team 16",
    leadUsername: "Team_16",
    leadName: "T. Yashwanth",
    usn: "23691a32j4",
    room: "203",
    mobile: "9652261139",
    email: "tangellayashwanth@gmail.com",
    dept: "DS C",
    members: [
      { name: "E. venkatesh", rollNumber: "23691a32i6", roomNumber: "203", mobile: "9392837185", email: "venkeyr162@gmail.com", dept: "DS C" },
      { name: "T. varaprasad", rollNumber: "23691a32h5", roomNumber: "203", mobile: "8639072937", email: "vara92701@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "17",
    teamName: "Resource Hub",
    leadUsername: "Team_17",
    leadName: "K. Sharmilla",
    usn: "23691A32E2",
    room: "203",
    mobile: "7989720146",
    email: "sharmilareddy1030@gmail.com",
    dept: "DS C",
    members: [
      { name: "K. Sandeep", rollNumber: "23691A32D7", roomNumber: "203", mobile: "8247397541", email: "Kurubasandeep93@gmail.com", dept: "DS C" },
      { name: "G. Sri Soumya", rollNumber: "23691A32E9", roomNumber: "203", mobile: "9014188736", email: "Sowmyagiddaluru07@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "18",
    teamName: "Team 18",
    leadUsername: "Team_18",
    leadName: "T.venkatesh",
    usn: "23691a05o3",
    room: "203",
    mobile: "9848709928",
    email: "venkateshtenepalli@gmail.com",
    dept: "CSE D",
    members: [
      { name: "R. tharun", rollNumber: "23691a05m6", roomNumber: "203", mobile: "8897134847", email: "rangareddygaritharun@gmail.com", dept: "CSE D" },
      { name: "A. Tejesh", rollNumber: "23691a05m0", roomNumber: "203", mobile: "9392064393", email: "tejeshandalamala000@gmail.com", dept: "CSE D" },
      { name: "G. Pawan", rollNumber: "23691A05E3", roomNumber: "203", mobile: "6303530159", email: "pavanpavan15910@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "19",
    teamName: "Team 19",
    leadUsername: "Team_19",
    leadName: "B Rajani",
    usn: "23681A05G1",
    room: "322",
    mobile: "8074918949",
    email: "rajanibeerangi@gmail.com",
    dept: "CSE C",
    members: [
      { name: "Sandra S Nair", rollNumber: "23691A05J1", roomNumber: "322", mobile: "9440369768", email: "sandrasnair14780@gmail.com", dept: "CSE C" },
      { name: "V.Sarala", rollNumber: "23691A05J6", roomNumber: "322", mobile: "8688321718", email: "saralasarala15024@gmail.com", dept: "CSE C" },
      { name: "A.Reddiswari", rollNumber: "23691A05G5", roomNumber: "322", mobile: "6303183304", email: "akkinapallireddiswari@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "20",
    teamName: "Team 20",
    leadUsername: "Team_20",
    leadName: "Zebnoor S",
    usn: "23691A05Q5",
    room: "322",
    mobile: "8688673677",
    email: "zebnoorshaik157@gmail.com",
    dept: "CSE D",
    members: [
      { name: "Vennela C", rollNumber: "23691A05O4", roomNumber: "322", mobile: "7989980425", email: "chamanchivenni@gmail.com", dept: "CSE D" },
      { name: "Thulasi M", rollNumber: "23691A05M7", roomNumber: "322", mobile: "8919837823", email: "thulasi36223622@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "21",
    teamName: "Team 21",
    leadUsername: "Team_21",
    leadName: "Madhuranaidu Tejaswini",
    usn: "23691A32G2",
    room: "203",
    mobile: "9392898968",
    email: "tejaswinimadhuranaidu@gmail.com",
    dept: "DS C",
    members: [
      { name: "Chilamakuru Varshini", rollNumber: "23691A32H7", roomNumber: "203", mobile: "9391401540", email: "chilamakuruvarshinivarsha@gmail.com", dept: "DS C" },
      { name: "Garlapati Varshini", rollNumber: "23691A32H8", roomNumber: "203", mobile: "9177292489", email: "Varshinidevi50@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "22",
    teamName: "Team 22",
    leadUsername: "Team_22",
    leadName: "K.Thanusha",
    usn: "23691A05M3",
    room: "322",
    mobile: "8074219921",
    email: "kthanusha05@gmail.com",
    dept: "CSE D",
    members: [
      { name: "Y.Tejaswi", rollNumber: "23691A05L8", roomNumber: "203", mobile: "9110763642", email: "yallalatejaswi@gmail.com", dept: "CSE D" },
      { name: "N.Tejaswini", rollNumber: "23691A05L9", roomNumber: "203", mobile: "9380088142", email: "teju33330@gmail.com", dept: "CSE D" },
      { name: "B.Yashaswini", rollNumber: "23691A05Q1", roomNumber: "203", mobile: "8309801771", email: "yashaswinibandi1825@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "23",
    teamName: "Team 23",
    leadUsername: "Team_23",
    leadName: "G Sai Jyothi",
    usn: "23691A05I0",
    room: "322",
    mobile: "8639383820",
    email: "saijyothireddy.03@gmail.com",
    dept: "CSE C",
    members: [
      { name: "B Pavani", rollNumber: "23691A05E0", roomNumber: "203", mobile: "8106277584", email: "pavani6322@gmail.com", dept: "CSE C" },
      { name: "D Rekha", rollNumber: "23691A05G9", roomNumber: "322", mobile: "8074577719", email: "devanga.rekha@gmail.com", dept: "CSE C" },
      { name: "G Sandhya", rollNumber: "23691A05J0", roomNumber: "322", mobile: "9182170152", email: "sandhyayadavguluru@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "24",
    teamName: "Team 24",
    leadUsername: "Team_24",
    leadName: "Y Manasa",
    usn: "24695A3211",
    room: "203",
    mobile: "9182583451",
    email: "manasayeddula25@gmail.com",
    dept: "DS B",
    members: [
      { name: "Anushka M", rollNumber: "23691A3207", roomNumber: "203", mobile: "8019674570", email: "anushkamekala2005@gmail.com", dept: "DS A" },
      { name: "Chandana M", rollNumber: "23691A3223", roomNumber: "203", mobile: "6301827987", email: "mchandana796@gmail.com", dept: "DS A" },
      { name: "Kalpana Reddy C", rollNumber: "23691A3257", roomNumber: "203", mobile: "9392777930", email: "Kalpanareddy9833@gmail.com", dept: "DS A" }
    ]
  },
  {
    num: "25",
    teamName: "Team 25",
    leadUsername: "Team_25",
    leadName: "Ramigani Tejaswini",
    usn: "23691A32G1",
    room: "203",
    mobile: "7989968797",
    email: "ramiganitejaswani@gmail.com",
    dept: "DS C",
    members: [
      { name: "Vennapusa Sumedha", rollNumber: "23691A32F7", roomNumber: "203", mobile: "8499034860", email: "sumedhavennapusa@gmail.com", dept: "DS C" },
      { name: "Somu Bhavya Reddy", rollNumber: "23691A0523", roomNumber: "203", mobile: "9381141351", email: "vsa071906@gmail.com", dept: "CSE A" }
    ]
  },
  {
    num: "26",
    teamName: "Team 26",
    leadUsername: "Team_26",
    leadName: "P Ujwala",
    usn: "23691A05N1",
    room: "322",
    mobile: "6305755220",
    email: "pandipatiujwala@gmail.com",
    dept: "CSE D",
    members: [
      { name: "Mude Sireesha", rollNumber: "23691A05K4", roomNumber: "322", mobile: "8310237976", email: "mudesiri1234@gmail.com", dept: "CSE D" },
      { name: "V.Suhitha", rollNumber: "23691A05L5", roomNumber: "322", mobile: "6305755220", email: "uhitha.vonteddu@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "27",
    teamName: "Team 27",
    leadUsername: "Team_27",
    leadName: "yaparla thirumaleswar reddy",
    usn: "23691a32g6",
    room: "203",
    mobile: "7013168524",
    email: "thirumaleswarreddy144@gmail.com",
    dept: "DS C",
    members: [
      { name: "T . Vardhan Reddy", rollNumber: "23691a32h6", roomNumber: "203", mobile: "9346683055", email: "paturuvarthan17@gmail.com", dept: "DS C" },
      { name: "T . Vinod Kumar", rollNumber: "23691a32i8", roomNumber: "203", mobile: "7997660534", email: "paruchurivinod09@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "28",
    teamName: "DK",
    leadUsername: "Team_28",
    leadName: "Vaileti Dinesh Kumar",
    usn: "23691A0541",
    room: "203",
    mobile: "6304038756",
    email: "vdkdinesh2615@gmail.com",
    dept: "CSE A",
    members: [
      { name: "Girraju Gnanadeep", rollNumber: "23691A0547", roomNumber: "203", mobile: "9700736904", email: "deepu.girraju@gmail.com", dept: "CSE A" },
      { name: "Guvalla Gowtham", rollNumber: "23691A0549", roomNumber: "203", mobile: "9703748244", email: "guvvalagowtham005@gmail.com", dept: "CSE A" }
    ]
  },
  {
    num: "29",
    teamName: "Team 29",
    leadUsername: "Team_29",
    leadName: "Thathvika Reddy",
    usn: "23691a32g4",
    room: "203",
    mobile: "9848905380",
    email: "malakathathvika@gmail.com",
    dept: "DS C",
    members: [
      { name: "chukka susmitha", rollNumber: "23691A32F9", roomNumber: "203", mobile: "9392768687", email: "chukkasusmitha45@gmail.com", dept: "DS C" },
      { name: "Nagarimadugu yakshitha", rollNumber: "23691A32J3", roomNumber: "203", mobile: "9398737362", email: "yakshitha.n19@gmail.com", dept: "DS C" },
      { name: "Y. Yuvasree Lakshmi", rollNumber: "23691A32J7", roomNumber: "203", mobile: "7780100362", email: "yakkalayuvasree@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "30",
    teamName: "Team 30",
    leadUsername: "Team_30",
    leadName: "chunchu susmitha",
    usn: "23691A32g0",
    room: "203",
    mobile: "7995017626",
    email: "sushmithachunchu41@gmail.com",
    dept: "DS C",
    members: [
      { name: "Thatiparthy Madhumathi", rollNumber: "23691A32G5", roomNumber: "203", mobile: "9392113975", email: "thatiparthymadhumathi@gmail.com", dept: "DS C" },
      { name: "shaik sammera", rollNumber: "23691A32d5", roomNumber: "203", mobile: "6305871571", email: "shaiksameera636@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "31",
    teamName: "Team 31",
    leadUsername: "Team_31",
    leadName: "Sree Charani",
    usn: "23691A05K9",
    room: "322",
    mobile: "8919984849",
    email: "sreecharani2006@gmail.com",
    dept: "CSE D",
    members: [
      { name: "S. Sreevalli", rollNumber: "23691A05L2", roomNumber: "322", mobile: "8688054409", email: "syamagarisreevalli@gmail.com", dept: "CSE D" },
      { name: "K.thanu sree", rollNumber: "23691A05M4", roomNumber: "322", mobile: "9121656540", email: "thanusree1111@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "32",
    teamName: "Team 32",
    leadUsername: "Team_32",
    leadName: "v.Subramanyam",
    usn: "23691a32f4",
    room: "203",
    mobile: "9392649348",
    email: "subramanyamsubbu407@gmail.com",
    dept: "DS C",
    members: [
      { name: "K. Yaswanth kumar", rollNumber: "23691a32j5", roomNumber: "203", mobile: "9347951776", email: "yaswanthk745@gmail.com", dept: "DS C" },
      { name: "B. Yaswanth kumar", rollNumber: "23691a32j6", roomNumber: "203", mobile: "7093366106", email: "yaswanthkumar692@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "33",
    teamName: "Team 33",
    leadUsername: "Team_33",
    leadName: "P Guru Varshini",
    usn: "24695A0504",
    room: "322",
    mobile: "9392764090",
    email: "padiguruvarshini@gmail.com",
    dept: "CSE A",
    members: [
      { name: "B Uha", rollNumber: "23691A05N0", roomNumber: "322", mobile: "6281027057", email: "uhachowdary456@gmail.com", dept: "CSE D" },
      { name: "Sk Shifa", rollNumber: "23691A05K1", roomNumber: "322", mobile: "8978633280", email: "Shifashaik453@mail.com", dept: "CSE D" },
      { name: "G Poojitha", rollNumber: "23691A05E5", roomNumber: "203", mobile: "7569936651", email: "poojaobilesug12345@gmail.com", dept: "CSE C" }
    ]
  },
  {
    num: "34",
    teamName: "Team 34",
    leadUsername: "Team_34",
    leadName: "M.Vijay krishna",
    usn: "23691a05o9",
    room: "322",
    mobile: "9618116143",
    email: "veekrish45@gmail.com",
    dept: "CSE D",
    members: [
      { name: "D. Vivek", rollNumber: "23691a05p7", roomNumber: "203", mobile: "9177471654", email: "danammagarivivek@gmail.com", dept: "CSE D" },
      { name: "Vignesh Mokshagna", rollNumber: "23691a05o7", roomNumber: "322", mobile: "7981680633", email: "ratakondamokshagnatej@gmail.com", dept: "CSE D" }
    ]
  },
  {
    num: "35",
    teamName: "Team 35",
    leadUsername: "Team_35",
    leadName: "Kota Sai Kumar",
    usn: "24695A0516",
    room: "203",
    mobile: "8897230577",
    email: "davidraj100925@gmail.com",
    dept: "CSE C",
    members: [
      { name: "TAMMINENI MEDARI SATHESH KUMAR", rollNumber: "24695A0517", roomNumber: "203", mobile: "6304051760", email: "tmsathesh50@gmail.com", dept: "CSE C" },
      { name: "S RUPESH", rollNumber: "24695a0515", roomNumber: "322", mobile: "8331865975", email: "sudarupesh2006@gmail.com", dept: "CSE C" },
      { name: "K BHANU TEJA", rollNumber: "24695a0502", roomNumber: "322", mobile: "7093464345", email: "tejab7752@gmail.com", dept: "CSE A" }
    ]
  },
  {
    num: "36",
    teamName: "Synntax Squard",
    leadUsername: "Team_36",
    leadName: "B. Srinivasulu",
    usn: "23691a32f1",
    room: "203",
    mobile: "6300650812",
    email: "ssrinu7568@gmail.com",
    dept: "DS C",
    members: [
      { name: "K.Siva Liladhar Reddy", rollNumber: "23691a32e5", roomNumber: "203", mobile: "9346258795", email: "korasivaliladharreddy@gmail.com", dept: "DS C" },
      { name: "Pandrati Umesh", rollNumber: "23691A32H0", roomNumber: "203", mobile: "6305520542", email: "umesh63055@gmail.com", dept: "DS C" }
    ]
  },
  {
    num: "37",
    teamName: "Team 37",
    leadUsername: "Team_37",
    leadName: "P.Praneeth Reddy",
    usn: "23691a05f1",
    room: "203",
    mobile: "9999999999",
    email: "praneethreddy37@gmail.com",
    dept: "CSE",
    members: [
      { name: "V. Suresh", rollNumber: "23691a05l7", roomNumber: "203", mobile: "", email: "suresh37@gmail.com", dept: "CSE" },
      { name: "P.Vishnu", rollNumber: "23691a05t6", roomNumber: "203", mobile: "", email: "vishnu37@gmail.com", dept: "CSE" },
      { name: "Omkar naik", rollNumber: "23691a05d1", roomNumber: "203", mobile: "", email: "omkarnaik37@gmail.com", dept: "CSE" }
    ]
  },
  {
    num: "38",
    teamName: "Team 38",
    leadUsername: "Team_38",
    leadName: "B. Raghavendra Naik",
    usn: "24695a0514",
    room: "322",
    mobile: "7842869151",
    email: "raghava9151@gmail.com",
    dept: "CSE C",
    members: [
      { name: "K. Siva Rama Krishna", rollNumber: "24695a0518", roomNumber: "203", mobile: "9392039375", email: "ksivaramakrishna771@gmail.com", dept: "CSE C" },
      { name: "B. Hari shankar", rollNumber: "24695a0505", roomNumber: "322", mobile: "8688335980", email: "balagundlahari@gmail.com", dept: "CSE A" },
      { name: "K . Rajakumarraju", rollNumber: "23691A05G0", roomNumber: "322", mobile: "7013048762", email: "krajakumarraju55@gamil.com", dept: "CSE C" }
    ]
  },
  {
    num: "39",
    teamName: "Team 39",
    leadUsername: "Team_39",
    leadName: "M.Lokesh",
    usn: "23691a0595",
    room: "203",
    mobile: "9885434520",
    email: "munthalokesh333@gmail.com",
    dept: "CSE B",
    members: [
      { name: "Attar Mohammed Faraz", rollNumber: "23691A05A4", roomNumber: "203", mobile: "7671964978", email: "amdfaraz17@gmail.com", dept: "CSE B" },
      { name: "T.Jhonny Dixit", rollNumber: "23691A0574", roomNumber: "203", mobile: "6305224690", email: "jhonnydixit@gmail.com", dept: "CSE B" }
    ]
  }
];

const seed39Teams = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find the default Batch for Java Full Stack / Capstone
    const batch = await Batch.findOne().populate('collegeId');
    if (!batch) {
      console.error('❌ No Batch found in database');
      process.exit(1);
    }
    console.log(`📌 Target Batch: "${batch.name}" (College: ${batch.collegeId?.name})`);

    const passwordHash = await bcrypt.hash('Mits@3!', 12);
    let createdCount = 0;

    for (const data of TEAMS_DATA) {
      // Upsert Team document
      const team = await Team.findOneAndUpdate(
        { leadUsername: data.leadUsername },
        {
          $set: {
            name: data.teamName,
            batchId: batch._id,
            collegeId: batch.collegeId._id,
            leadUsername: data.leadUsername,
            email: data.email.toLowerCase().trim(),
            passwordHash: passwordHash,
            leadName: data.leadName,
            usnRollNumber: data.usn,
            mobile: data.mobile,
            dept: data.dept,
            roomNumber: data.room,
            mustChangePassword: true,
            status: 'problem_pending',
            members: data.members.map(m => ({
              name: m.name,
              rollNumber: m.rollNumber,
              email: m.email.toLowerCase().trim(),
              mobile: m.mobile,
              dept: m.dept,
              roomNumber: m.roomNumber
            }))
          }
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Upserted ${data.leadUsername} ("${data.teamName}") - Lead: ${data.leadName}`);
      createdCount++;

      // Send welcome credential email to Team Lead
      sendTLCredentials(data.email.toLowerCase().trim(), data.leadUsername, 'Mits@3!', batch.name);

      // Send copy to jaswanthnarne35@gmail.com as requested
      sendTLCredentials('jaswanthnarne35@gmail.com', `${data.leadUsername} (${data.teamName})`, 'Mits@3!', batch.name);
    }

    console.log(`\n🎉 Successfully processed and seeded all ${createdCount} teams! Emails dispatched.`);
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed39Teams();
