import { TaskRunner } from './core/taskRunner.js';
import type { AgentTask } from './types/index.js';

async function runDemo() {
  console.log('\n=======================================');
  console.log('🚀 Starting Tempo AgentPay Demo 🚀');
  console.log('=======================================\n');

  const runner = new TaskRunner();

  // 1. Submit task with $5 cap
  const task: AgentTask = {
    taskId: 'task-1234',
    requestedAt: Date.now(),
    input: 'What is the future of autonomous agents?',
    budgetMax: 5.0,
  };

  console.log(`[+] Task Submitted: ${task.taskId}`);
  console.log(`[+] Task Prompt: "${task.input}"`);
  console.log(`[+] Max Budget: $${task.budgetMax.toFixed(2)}\n`);

  console.log(`[+] Initiating Paid Data Fetch Sequence (with fallback sim)...\n`);

  // executeTask with mock failure flag for Provider A
  const simFailFirst = true;

  try {
    const result = await runner.executeTask(task, simFailFirst);

    console.log('\n=======================================');
    console.log('📊 AgentPay Task Report 📊');
    console.log('=======================================');
    console.log(`Status:            ${result.finalStatus === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Providers Touched: ${result.providerUsed.join(', ')}`);
    
    console.log(`Total Spent:       $${result.totalCost.toFixed(3)}`);
    console.log(`Remaining Budget:  $${result.budgetRemaining.toFixed(3)}\n`);

    console.log('--- Itemized Ledger ---');
    result.calls.forEach((call, i) => {
      console.log(`${i + 1}. Provider: ${call.provider} | Endpoint: ${call.endpoint}`);
      console.log(`   Status:  ${call.status}`);
      console.log(`   Latency: ${call.latencyMs}ms`);
      console.log(`   Cost:    $${call.cost.toFixed(3)}`);
      if (call.error) {
        console.log(`   Error:   ${call.error}`);
      }
      console.log('');
    });

    console.log('--- Final Output ---');
    if (result.output) {
      console.log(result.output.substring(0, 500) + '...\n');
    } else {
      console.log('No valid output retrieved.\n');
    }

  } catch (err) {
    console.error('Fatal Error executing task:', err);
  }
}

runDemo();
