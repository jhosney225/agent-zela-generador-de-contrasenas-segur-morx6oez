
```javascript
import Anthropic from "@anthropic-ai/sdk";
import readline from "readline";

const client = new Anthropic();

// Calculate Shannon entropy for a string
function calculateEntropy(password) {
  const frequencies = {};
  for (const char of password) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  const length = password.length;

  for (const char in frequencies) {
    const probability = frequencies[char] / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

// Get character set size for entropy calculation
function getCharacterSetSize(password) {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let size = 0;
  if (hasLowercase) size += 26;
  if (hasUppercase) size += 26;
  if (hasNumbers) size += 10;
  if (hasSpecial) size += 32;

  return size;
}

// Calculate entropy based on character set and length
function calculateTheoreticalEntropy(password) {
  const charsetSize = getCharacterSetSize(password);
  const entropy = Math.log2(Math.pow(charsetSize, password.length));
  return entropy;
}

// Evaluate password strength
function evaluatePasswordStrength(password) {
  const entropy = calculateTheoreticalEntropy(password);
  let strength = "Very Weak";

  if (entropy >= 128) {
    strength = "Very Strong";
  } else if (entropy >= 100) {
    strength = "Strong";
  } else if (entropy >= 80) {
    strength = "Moderate";
  } else if (entropy >= 50) {
    strength = "Weak";
  }

  return { entropy, strength };
}

// Format entropy display with visual bar
function formatEntropyDisplay(entropy) {
  const maxEntropy = 128;
  const barLength = 30;
  const filledLength = Math.round((entropy / maxEntropy) * barLength);
  const emptyLength = barLength - filledLength;

  const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
  const percentage = Math.round((entropy / maxEntropy) * 100);

  return `
Entropy: ${entropy.toFixed(2)} bits
Strength: [${bar}] ${percentage}%`;
}

async function generatePasswordWithClaude(requirements) {
  const systemPrompt = `You are a secure password generator. Generate passwords based on user requirements.
Return ONLY the password itself, nothing else. No explanations, no quotes, just the password.
Make sure to follow these rules:
- Include uppercase and lowercase letters
- Include numbers
- Include special characters
- Make it at least 12 characters long
- Be truly random and unpredictable`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 100,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate a secure password with the following requirements: ${requirements}`,
      },
    ],
  });

  const password = message.content[0].text.trim();
  return password;
}

async function analyzePasswordWithClaude(password) {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Analyze the security of this password from a technical perspective. Consider entropy, character diversity, and resistance to common attacks. Password: "${password}"
        
        Provide a brief security assessment and any recommendations.`,
      },
    ],
  });

  return message.content[0].text;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  console.log("\n🔐 Secure Password Generator with Entropy Meter");
  console.log("=".repeat(50));

  let running = true;
  while (running) {
    console.log("\nOptions:");
    console.log("1. Generate a new secure password");
    console.log("2. Analyze an existing password");
    console.log("3. Exit");

    const choice = await question("\nSelect option (1-3): ");

    if (choice === "1") {
      console.log("\nPassword Generation Requirements:");
      console.log("- Default: 16 characters with mixed case, numbers, and symbols");

      const customReq =
        (await question(
          "Enter custom requirements (or press Enter for default): "
        )) || "16 characters long, mixed case, numbers and special symbols";

      console.log("\n🔄 Generating secure password...");
      const password = await generatePasswordWithClaude(customReq);

      const { entropy, strength } = evaluatePasswordStrength(password);

      console.log("\n✨ Generated Password: " + password);
      console.log(formatEntropyDisplay(entropy));
      console.log(`Strength Level: ${strength}`);

      console.log("\n🔍 AI Security Analysis:");
      const analysis = await analyzePasswordWithClaude(password);
      console.log(analysis);
    } else if (choice === "2") {
      const password = await question("\nEnter the password to analyze: ");

      if (password.length === 0) {
        console.log("❌ Password cannot be empty");
        