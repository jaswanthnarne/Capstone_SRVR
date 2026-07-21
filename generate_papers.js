const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// CSS Stylesheet to perfectly mimic Exam Paper Set 3.pdf
const STYLESHEET = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', sans-serif;
    font-size: 9.5pt;
    line-height: 1.45;
    color: #1e293b;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    -webkit-print-color-adjust: exact;
  }
  
  .page-container {
    width: 100%;
    height: 258mm; /* Standard A4 height is 297mm. With 18mm top/bottom margins, printable is 261mm. 258mm height ensures no overflow. */
    border: 1.2px solid #cbd5e1; /* Thin gray page border */
    padding: 8mm 10mm;
    box-sizing: border-box;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  
  .page-container:last-child {
    page-break-after: avoid;
  }
  
  /* HEADER ROW (Logo left, Text right) */
  .header-row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .logo-box {
    margin-right: 15px;
    display: flex;
    align-items: center;
  }
  
  .title-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .company-name {
    font-size: 13.5pt;
    font-weight: 800;
    color: #0b5394; /* Dark blue matching template */
    letter-spacing: 0.2px;
    margin: 0;
    line-height: 1.2;
  }
  
  .course-subtitle {
    font-size: 9pt;
    font-weight: 500;
    font-style: italic;
    color: #64748b;
    margin-top: 2px;
    margin-bottom: 0;
  }
  
  .header-divider {
    border: 0;
    height: 1px;
    background-color: #3b82f6;
    margin: 4px 0 10px 0;
  }
  
  /* EXAM SET TITLE BLOCK */
  .exam-set-block {
    text-align: center;
    margin-bottom: 12px;
  }
  
  .exam-set-num {
    font-size: 11pt;
    font-weight: 800;
    color: #cc0000; /* Crimson red */
    text-transform: uppercase;
    margin: 0;
    letter-spacing: 0.5px;
  }
  
  .exam-subject-title {
    font-size: 10.5pt;
    font-weight: 800;
    color: #0b5394;
    text-transform: uppercase;
    margin: 2px 0 0 0;
    letter-spacing: 0.5px;
  }
  
  /* QUESTION HEADERS */
  .question-title-bar {
    background-color: #e6f0fa; /* Very light blue background tint matching template */
    padding: 6px 10px;
    margin-top: 12px;
    margin-bottom: 8px;
    font-weight: 700;
    font-size: 9.5pt;
    color: #0b5394; /* Dark blue */
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 2px;
  }
  
  .marks-label {
    color: #cc0000; /* Red marks indicator */
    font-weight: 700;
    font-size: 9pt;
  }
  
  /* QUESTION CONTENT */
  .question-description {
    font-size: 9pt;
    margin: 0 0 6px 0;
    text-align: justify;
    line-height: 1.4;
  }
  
  .requirements-header {
    font-weight: 700;
    font-style: italic;
    font-size: 9pt;
    margin: 6px 0 3px 0;
  }
  
  .requirements-list {
    margin: 0;
    padding-left: 18px;
    font-size: 9pt;
  }
  
  .requirements-list li {
    margin-bottom: 4px;
    text-align: justify;
  }
  
  .bold-label {
    font-weight: 700;
  }
  
  /* MONOSPACE CODE BLOCKS */
  .code-block {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    padding: 6px 12px;
    margin: 6px 0 6px 18px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    color: #0f172a;
    border-radius: 3px;
    white-space: pre-wrap;
    word-break: break-all;
  }
  
  /* SIGNATURE END OF PAPER BLOCK */
  .end-of-paper {
    text-align: center;
    font-size: 9.5pt;
    font-weight: 700;
    color: #0b5394;
    margin-top: auto; /* Push to bottom of page 2 container */
    padding-top: 10px;
    letter-spacing: 1px;
  }
`;

// Inline SVG Ethnotech Logo to perfectly match the original document
const LOGO_SVG = `
  <svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="none" stroke="#0b5394" stroke-width="4.5"/>
    <circle cx="50" cy="50" r="39" fill="#0b5394"/>
    <g transform="translate(50,50) scale(1.3)">
      <path d="M0 -15 L3 -5 L12 -12 L6 -2 L15 0 L6 2 L12 12 L3 5 L0 15 L-3 5 L-12 12 L-6 2 L-15 0 L-6 -2 L-12 -12 L-3 -5 Z" fill="#ffffff"/>
      <circle cx="0" cy="0" r="4" fill="#0b5394"/>
    </g>
  </svg>
`;

const EXAM_DATA = [
  {
    setNum: "1",
    examTitle: "CYBER SECURITY FUNDAMENTALS & SYSTEMS SECURITY",
    questions: [
      {
        num: "1",
        title: "CYBER SECURITY FUNDAMENTALS & NETWORKING",
        marks: "10 Marks",
        description: "A growing retail business wants to audit its network setup to ensure client transaction data is protected from basic eavesdropping and hijacking attempts.",
        requirements: [
          "<span class=\"bold-label\">CIA Triad Analysis:</span> Explain the three components of the CIA Triad (Confidentiality, Integrity, Availability) within this e-commerce context. Describe the flow of data using the OSI model layers and identify the specific layer where TLS (Transport Layer Security) operates to encrypt web traffic.",
          "<span class=\"bold-label\">Wireshark Display Filters:</span> You are tasked with running a packet capture in Wireshark. Write down the display filters to view only HTTP GET traffic and DNS queries.",
          "<span class=\"bold-label\">Cisco Packet Tracer Simulation:</span> Describe the steps to build and simulate a basic network containing a router, a switch, and a secure server."
        ]
      },
      {
        num: "2",
        title: "CORE SYSTEMS SECURITY & OFFENSIVE RECON",
        marks: "15 Marks",
        description: "An internal security audit is scheduled to check for misconfigured permissions on local workstations and review external network security boundaries.",
        requirements: [
          "<span class=\"bold-label\">OS Hardening & CLI Commands:</span> Describe the commands in Linux to change file permissions (chmod/chown) and check active system users in the '/etc/passwd' file. On the Windows side, explain how to configure Local Security Policies to enforce account lockout thresholds and list active services running in the background.",
          "<span class=\"bold-label\">Reconnaissance Scan Commands:</span> Explain the difference between active reconnaissance and passive reconnaissance. Write down the exact Nmap command to scan a target IP range to check for open ports, determine service versions (-sV), and run default vulnerability scripts (-sC):",
          "<span class=\"bold-label\">Maltego Visualizations:</span> Briefly explain the role of Maltego in mapping infrastructure nodes and threat intelligence correlations."
        ],
        code: "nmap -sV -sC -p 22,80,443,3306,8080 <target_ip>"
      },
      {
        num: "3",
        title: "NETWORK ATTACKS & ENDPOINT THREAT DEFENSE",
        marks: "15 Marks",
        description: "During a routine check, the network administrator notices a high volume of incomplete TCP connections on the public interface, while a user reports receiving security warning popups.",
        requirements: [
          "<span class=\"bold-label\">SYN Flood Mitigation:</span> Explain how a TCP SYN flood attack exploits the three-way handshake to cause a denial of service. Explain how you would configure a pfSense firewall to enable SYN Cookies to mitigate this threat.",
          "<span class=\"bold-label\">Intrusion Detection Rules:</span> Write a custom Snort or Suricata rule to trigger an alert on incoming TCP traffic targeting port 80:",
          "<span class=\"bold-label\">Endpoint Process Inspection:</span> Describe the step-by-step procedure to analyze a suspicious running process on a Windows host using Sysinternals tools (such as Process Explorer and Autoruns). Detail how to identify if the process is signed, locate its directory path, and find if it has registered for startup persistence."
        ],
        code: "alert tcp any any -> $HOME_NET 80 (msg:\"Inbound HTTP connection detected\"; sid:1000001; rev:1;)"
      },
      {
        num: "4",
        title: "CLOUD GOVERNANCE, SOC ARCHITECTURE & SCADA SECURITY",
        marks: "20 Marks",
        description: "A software provider is migrating its client management dashboard to a public cloud environment (AWS). The company must ensure that its web applications are secure, their identity access policies are strictly governed, and their Security Operations Center (SOC) is ready to handle cloud incidents in compliance with ISO 27001.",
        requirements: [
          "<span class=\"bold-label\">Part A: Secure SDLC & API Testing (5 Marks):</span> Describe SQL Injection (SQLi) and Stored Cross-Site Scripting (XSS) vulnerabilities. Explain how to integrate static analysis (SonarQube) and dynamic testing (OWASP ZAP) into the DevSecOps pipeline to catch these vulnerabilities before deployment.",
          "<span class=\"bold-label\">Part B: Cloud Identity & Access Control (5 Marks):</span> Define the Shared Responsibility Model in cloud computing. Explain how to configure AWS Identity and Access Management (IAM) to enforce the Principle of Least Privilege using Role-Based Access Control (RBAC) and Multi-Factor Authentication (MFA).",
          "<span class=\"bold-label\">Part C: SIEM Log Correlation & Incident Response (5 Marks):</span> Describe the general workflow of a SOC analyst when an alert is generated. Explain how a SIEM (like Splunk or ELK Stack) is used to correlate server login logs to detect a brute-force attack. Outline the six stages of the incident response lifecycle.",
          "<span class=\"bold-label\">Part D: OT SCADA Systems & GRC Compliance (5 Marks):</span> Compare IT security priorities (Confidentiality) with OT/SCADA priorities (Availability and Safety). Explain how to use the STRIDE threat modeling methodology to identify security risks in a web application. Briefly describe the purpose of Business Continuity and Disaster Recovery (BCDR) planning under ISO 27001."
        ]
      }
    ]
  },
  {
    setNum: "2",
    examTitle: "NETWORK DEFENSE, ETHICAL HACKING & RECONNAISSANCE",
    questions: [
      {
        num: "1",
        title: "CYBER SECURITY FUNDAMENTALS & NETWORKING",
        marks: "10 Marks",
        description: "A corporate office wants to secure its internal mail server from email spoofing and network eavesdropping attempts by external actors.",
        requirements: [
          "<span class=\"bold-label\">Cryptographic Fundamentals:</span> Explain the difference between symmetric and asymmetric encryption. Describe how both are used together to establish a secure connection (such as an HTTPS session) over the TCP/IP network stack.",
          "<span class=\"bold-label\">Wireshark Analysis:</span> How would you use Wireshark to locate and inspect suspicious UDP packets in a live capture? Provide the display filters to check for SMTP traffic.",
          "<span class=\"bold-label\">Cisco Packet Tracer simulation:</span> Describe how you would use Cisco Packet Tracer to construct a secure DMZ subnet hosting a mail server."
        ]
      },
      {
        num: "2",
        title: "CORE SYSTEMS SECURITY & OFFENSIVE RECON",
        marks: "15 Marks",
        description: "A security analyst is preparing a routine compliance assessment and needs to audit system login logs and conduct a vulnerability scan on internal servers.",
        requirements: [
          "<span class=\"bold-label\">OS Log Auditing:</span> Explain how to audit authentication logs in Linux (/var/log/auth.log or /var/log/secure) and Windows Event Viewer. Identify the specific Windows Security Log Event IDs or Linux keywords you would search for to detect repeated failed login attempts.",
          "<span class=\"bold-label\">Network Footprinting & Scanning:</span> Detail the steps of network footprinting. Write the exact Nmap commands to execute a SYN stealth scan (-sS) against a target subnet to determine open ports and operating system versions (-O):",
          "<span class=\"bold-label\">Netcat Banner Grabbing:</span> Explain the usage of Netcat for simple banner grabbing on port 80."
        ],
        code: "nmap -sS -O -T4 192.168.1.0/24"
      },
      {
        num: "3",
        title: "NETWORK ATTACKS & ENDPOINT THREAT DEFENSE",
        marks: "15 Marks",
        description: "A network administrator detects unauthorized local traffic routing, while a user reports receiving anomalous desktop alerts from a security agent.",
        requirements: [
          "<span class=\"bold-label\">ARP Spoofing Mechanics:</span> Describe the mechanics of an ARP spoofing Man-in-the-Middle (MitM) attack. Explain how you would configure a pfSense gateway or Snort rules to detect anomalous ARP replies.",
          "<span class=\"bold-label\">Custom Detection Signatures:</span> Write a custom Snort rule that alerts on HTTP traffic containing executable files (e.g., '.exe' or '.bat') in the payload:",
          "<span class=\"bold-label\">EDR Endpoint Isolation:</span> Explain how Microsoft Defender ATP (Endpoint Detection and Response) and Windows Task Manager help administrators locate and isolate a suspicious running process. Detail the steps to block a compromised host from communicating with the rest of the network."
        ],
        code: "alert tcp $EXTERNAL_NET any -> $HOME_NET any (msg:\"Executable download attempt\"; content:\".exe\"; sid:1000002; rev:1;)"
      },
      {
        num: "4",
        title: "CLOUD GOVERNANCE, SOC ARCHITECTURE & SCADA SECURITY",
        marks: "20 Marks",
        description: "A healthcare provider is deploying a web-based patient registry portal hosted on Azure cloud. The portal contains patient personal data which must comply with GDPR and local healthcare security regulations. The organization operates a centralized SOC for security monitoring.",
        requirements: [
          "<span class=\"bold-label\">Part A: Secure SDLC & API Testing (5 Marks):</span> Explain the importance of a secure SDLC. Detail how to use tools like Burp Suite and OWASP ZAP to perform vulnerability scanning on a web application portal, specifically testing for input validation vulnerabilities.",
          "<span class=\"bold-label\">Part B: Cloud Identity & Access Control (5 Marks):</span> Explain how Role-Based Access Control (RBAC) and Multi-Factor Authentication (MFA) are implemented in Azure Active Directory (Entra ID) to secure patient records. Discuss the Shared Responsibility Model regarding cloud database encryption.",
          "<span class=\"bold-label\">Part C: SIEM Log Correlation & Incident Response (5 Marks):</span> Describe how a SIEM platform (Splunk or ELK Stack) is used to collect and parse logs from web servers. Define a correlation rule to detect when a single IP address makes multiple administrative requests in under one minute. Outline the incident response containment phase.",
          "<span class=\"bold-label\">Part D: OT SCADA Systems & GRC Compliance (5 Marks):</span> Describe the difference between IT and OT systems regarding patching windows and safety. Explain how a GRC analyst uses a risk assessment template to record risks, map them to GDPR regulations, and document business continuity measures."
        ]
      }
    ]
  },
  {
    setNum: "3",
    examTitle: "CLOUD SECURITY, SOC OPERATIONS & OT COMPLIANCE",
    questions: [
      {
        num: "1",
        title: "CYBER SECURITY FUNDAMENTALS & NETWORKING",
        marks: "10 Marks",
        description: "A regional office wants to verify that its remote network connections are protected from unauthorized access and snooping over public routing paths.",
        requirements: [
          "<span class=\"bold-label\">OSI vs TCP/IP:</span> Contrast the OSI model and the TCP/IP model. Explain how IP packets are routed across subnets and identify the role of common services like DHCP and DNS in network connectivity.",
          "<span class=\"bold-label\">Wireshark Analysis:</span> Write a Wireshark display filter to capture only the TCP three-way handshake packets (SYN, SYN-ACK, ACK).",
          "<span class=\"bold-label\">Cisco Packet Tracer simulation:</span> In Cisco Packet Tracer, describe the steps to configure a basic Access Control List (ACL) to block HTTP access from a specific subnet to a web server."
        ]
      },
      {
        num: "2",
        title: "CORE SYSTEMS SECURITY & OFFENSIVE RECON",
        marks: "15 Marks",
        description: "A security team needs to perform basic configuration hardening on an office file server and run an internal network discovery scan.",
        requirements: [
          "<span class=\"bold-label\">OS Management and Hardening:</span> Describe how user permissions are managed in Linux using groups and the 'chown' command. On Windows, explain the difference between NTFS permissions and Share permissions, and how Group Policy Objects (GPOs) enforce desktop security.",
          "<span class=\"bold-label\">Domain Reconnaissance:</span> Detail how security teams find domain information using Whois and Maltego. Write the Nmap command to perform a quick port scan (-F) and determine the target's operating system version (-O):",
          "<span class=\"bold-label\">Netcat Troubleshooting:</span> Explain how Netcat can be used to connect to a target port to verify if it is open."
        ],
        code: "nmap -F -O <target_ip>"
      },
      {
        num: "3",
        title: "NETWORK ATTACKS & ENDPOINT THREAT DEFENSE",
        marks: "15 Marks",
        description: "A system administrator monitors gateway activity and spots anomalous connections, while an endpoint alert indicates an execution block on a user workstation.",
        requirements: [
          "<span class=\"bold-label\">Boundary Defense Architectures:</span> Explain how firewalls differ from Intrusion Detection/Prevention Systems (IDS/IPS). Describe how to deploy Snort or Suricata in an enterprise network to monitor incoming traffic.",
          "<span class=\"bold-label\">Boundary Control Rules:</span> Write a custom Snort signature to alert on UDP traffic targeting port 53 (DNS) from an internal IP range:",
          "<span class=\"bold-label\">Workstation Hardening:</span> Outline a system hardening plan for a Windows host to prevent malware execution. Detail how to disable unused services, configure Windows Defender to block suspicious macro execution, and isolate a compromised host from the network using administrative tools."
        ],
        code: "alert udp 192.168.1.0/24 any -> any 53 (msg:\"Internal DNS query detected\"; sid:1000003; rev:1;)"
      },
      {
        num: "4",
        title: "CLOUD GOVERNANCE, SOC ARCHITECTURE & SCADA SECURITY",
        marks: "20 Marks",
        description: "A financial technology startup is preparing its online payment processing portal for audit and compliance certifications. The startup uses a hybrid cloud infrastructure and is establishing a Security Operations Center (SOC) to monitor operations and satisfy regulatory GRC frameworks.",
        requirements: [
          "<span class=\"bold-label\">Part A: Secure SDLC & API Testing (5 Marks):</span> Explain the OWASP Top 10 API Security vulnerabilities, specifically Broken Object Level Authorization (BOLA). Describe how static analysis (SonarQube) and dynamic security testing (OWASP ZAP) differ in locating these vulnerabilities.",
          "<span class=\"bold-label\">Part B: Cloud Identity & Access Control (5 Marks):</span> What is the purpose of Single Sign-On (SSO) and Role-Based Access Control (RBAC) in cloud deployments? Discuss how AWS Security Hub or Azure Security Center monitors IAM policies to detect misconfigurations.",
          "<span class=\"bold-label\">Part C: SIEM Log Correlation & Incident Response (5 Marks):</span> Explain how SIEM systems parse different log formats from web servers and firewalls. Outline the containment and eradication phases of the incident response lifecycle when an administrative endpoint is compromised.",
          "<span class=\"bold-label\">Part D: OT SCADA Systems & GRC Compliance (5 Marks):</span> Explain the Purdue Model for industrial control system network segmentation. Define what a GRC risk register is and how it helps track compliance with GDPR and NIST security guidelines."
        ]
      }
    ]
  }
];

function generateHTMLForPage1(paper) {
  const q1 = paper.questions[0];
  const q2 = paper.questions[1];
  
  const q1Reqs = q1.requirements.map(req => `<li>${req}</li>`).join('');
  const q2Reqs = q2.requirements.map(req => `<li>${req}</li>`).join('');
  
  let q2CodeHtml = "";
  if (q2.code) {
    q2CodeHtml = `<div class="code-block">${q2.code}</div>`;
  }
  
  return `
    <div class="page-container">
      <!-- HEADER BLOCK -->
      <div class="header-row">
        <div class="logo-box">
          ${LOGO_SVG}
        </div>
        <div class="title-box">
          <h1 class="company-name">ETHNOTECH ACADEMIC SOLUTIONS PVT LTD</h1>
          <h2 class="course-subtitle">Cybersecurity Engineering & Offensive Operations Program — Technical Examination</h2>
        </div>
      </div>
      
      <hr class="header-divider">
      
      <div class="exam-set-block">
        <div class="exam-set-num">EXAM SET ${paper.setNum}</div>
        <div class="exam-subject-title">${paper.examTitle}</div>
      </div>
      
      <!-- QUESTION 1 -->
      <div class="question-title-bar">
        <span>QUESTION 1: ${q1.title}</span>
        <span class="marks-label">[${q1.marks}]</span>
      </div>
      <p class="question-description">${q1.description}</p>
      <div class="requirements-header">Requirements:</div>
      <ul class="requirements-list">
        ${q1Reqs}
      </ul>
      
      <!-- QUESTION 2 -->
      <div class="question-title-bar">
        <span>QUESTION 2: ${q2.title}</span>
        <span class="marks-label">[${q2.marks}]</span>
      </div>
      <p class="question-description">${q2.description}</p>
      <div class="requirements-header">Requirements:</div>
      <ul class="requirements-list">
        ${q2Reqs}
      </ul>
      ${q2CodeHtml}
    </div>
  `;
}

function generateHTMLForPage2(paper) {
  const q3 = paper.questions[2];
  const q4 = paper.questions[3];
  
  const q3Reqs = q3.requirements.map(req => `<li>${req}</li>`).join('');
  const q4Reqs = q4.requirements.map(req => `<li>${req}</li>`).join('');
  
  let q3CodeHtml = "";
  if (q3.code) {
    q3CodeHtml = `<div class="code-block">${q3.code}</div>`;
  }
  
  return `
    <div class="page-container">
      <!-- QUESTION 3 -->
      <div class="question-title-bar">
        <span>QUESTION 3: ${q3.title}</span>
        <span class="marks-label">[${q3.marks}]</span>
      </div>
      <p class="question-description">${q3.description}</p>
      <div class="requirements-header">Requirements:</div>
      <ul class="requirements-list">
        ${q3Reqs}
      </ul>
      ${q3CodeHtml}
      
      <!-- QUESTION 4 -->
      <div class="question-title-bar">
        <span>QUESTION 4: ${q4.title}</span>
        <span class="marks-label">[${q4.marks}]</span>
      </div>
      <p class="question-description">${q4.description}</p>
      <div class="requirements-header">Requirements:</div>
      <ul class="requirements-list">
        ${q4Reqs}
      </ul>
      
      <!-- SIGNATURE END OF PAPER BLOCK -->
      <div class="end-of-paper">
        — END OF QUESTION PAPER —
      </div>
    </div>
  `;
}

async function run() {
  console.log("Starting PDF generation process (mimicking Set 3)...");
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const outputDir = 'd:\\Capstone';

  for (let i = 0; i < EXAM_DATA.length; i++) {
    const paper = EXAM_DATA[i];
    const setNum = paper.setNum;
    
    // Construct HTML for both pages of this Set
    const htmlPage1 = generateHTMLForPage1(paper);
    const htmlPage2 = generateHTMLForPage2(paper);
    
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Exam Paper Set ${setNum}</title>
        <style>
          ${STYLESHEET}
        </style>
      </head>
      <body>
        ${htmlPage1}
        ${htmlPage2}
      </body>
      </html>
    `;
    
    console.log(`Rendering Set ${setNum} HTML...`);
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const outputPath = path.join(outputDir, `Question_Paper_Set_${setNum}.pdf`);
    console.log(`Writing Set ${setNum} PDF to ${outputPath}...`);
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 7.5pt; font-family: 'Inter', sans-serif; width: 100%; display: flex; justify-content: flex-end; color: #64748b; padding: 0 45px; margin-top: 15px; font-weight: 500;">
          <span>Comprehensive Technical Examination | Cybersecurity Engineering & Operations</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 7.5pt; font-family: 'Inter', sans-serif; width: 100%; display: flex; justify-content: center; color: #64748b; margin-bottom: 15px; font-weight: 500;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> &bull; Ethnotech Academic Solutions Pvt Ltd</span>
        </div>
      `,
      margin: {
        top: '18mm',
        bottom: '18mm',
        left: '15mm',
        right: '15mm'
      }
    });
  }
  
  // Construct combined HTML for all sets
  let combinedHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Cybersecurity Question Papers - All Sets</title>
      <style>
        ${STYLESHEET}
      </style>
    </head>
    <body>
  `;
  
  for (let i = 0; i < EXAM_DATA.length; i++) {
    const paper = EXAM_DATA[i];
    combinedHtml += generateHTMLForPage1(paper);
    combinedHtml += generateHTMLForPage2(paper);
    if (i < EXAM_DATA.length - 1) {
      combinedHtml += `<div style="page-break-after: always; break-after: page;"></div>`;
    }
  }
  
  combinedHtml += `
    </body>
    </html>
  `;
  
  console.log("Rendering combined sets HTML...");
  await page.setContent(combinedHtml, { waitUntil: 'networkidle0' });
  const combinedOutputPath = path.join(outputDir, "Question_Papers_All_Sets.pdf");
  console.log(`Writing combined PDF to ${combinedOutputPath}...`);
  
  await page.pdf({
    path: combinedOutputPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 7.5pt; font-family: 'Inter', sans-serif; width: 100%; display: flex; justify-content: flex-end; color: #64748b; padding: 0 45px; margin-top: 15px; font-weight: 500;">
        <span>Comprehensive Technical Examination | Cybersecurity Engineering & Operations</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7.5pt; font-family: 'Inter', sans-serif; width: 100%; display: flex; justify-content: center; color: #64748b; margin-bottom: 15px; font-weight: 500;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> &bull; Ethnotech Academic Solutions Pvt Ltd</span>
      </div>
    `,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm'
    }
  });

  await browser.close();
  console.log("All question papers generated successfully matching the target format!");
}

run().catch(err => {
  console.error("Error generating question papers:", err);
  process.exit(1);
});
