import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const AGENTSCOPE_REVISION = '72f3f6fa0b2fc38b8517f408ab616f0f2bd229e6';
export const AGENTSCOPE_CAPABILITY = 'multimodal.agent.agentscope@1.0.0';

function env(name:string,fallback=''){return (process.env[name]??fallback).trim();}
function enabled(){return /^(1|true|yes)$/i.test(env('SOUL_N03_AGENTSCOPE_ENABLED'));}
function config(){return {python:env('SOUL_N03_AGENTSCOPE_PYTHON','python3'),root:path.resolve(env('SOUL_N03_AGENTSCOPE_ROOT','integrations/soul-upstream/agentscope')),runner:path.resolve(env('SOUL_N03_AGENTSCOPE_RUNNER','scripts/agentscope_runner.py')),timeoutMs:Math.max(5000,Number.parseInt(env('SOUL_N03_AGENTSCOPE_TIMEOUT_MS','120000'),10)||120000)};}
export function describeAgentScopeAdapter(){const c=config();const source=fs.existsSync(c.root)&&fs.statSync(c.root).isDirectory();return {provider:'agentscope-ai/agentscope',revision:AGENTSCOPE_REVISION,capability:AGENTSCOPE_CAPABILITY,enabled:enabled(),sourcePresent:source,state:!enabled()?'DEGRADED':!source?'DEGRADED':'CONFIGURED',code:!enabled()?'AGENTSCOPE_ADAPTER_DISABLED':!source?'AGENTSCOPE_SOURCE_NOT_AVAILABLE':'AGENTSCOPE_RUNTIME_CONFIGURED'};}
export function isAgentScopeExecutable(){const x=describeAgentScopeAdapter();return x.state==='CONFIGURED'&&Boolean(env('GEMINI_API_KEY'));}

export async function runAgentScopePerception(input:{text:string;audioBase64?:string;audioMimeType?:string}) {
  const evidence=describeAgentScopeAdapter();
  if(!isAgentScopeExecutable()) return {...evidence};
  if(!input.text.trim()) return {...evidence,state:'FAIL',code:'AGENTSCOPE_TEXT_REQUIRED'};
  const c=config();
  const child=spawn(c.python,[c.runner],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='';
  child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
  child.stdout.on('data',x=>{stdout+=x});child.stderr.on('data',x=>{stderr+=x});
  const result=await new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>{child.kill('SIGTERM');reject(new Error('AGENTSCOPE_TIMEOUT'));},c.timeoutMs);child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',(code,signal)=>{clearTimeout(timer);resolve({code,signal})});child.stdin.end(JSON.stringify(input));}).catch(error=>({code:null,error}));
  if(result.error) return {...evidence,state:'DEGRADED',code:result.error.message,stderr:stderr.slice(-4000)};
  if(result.code!==0) return {...evidence,state:'FAIL',code:'AGENTSCOPE_PROCESS_FAILED',exitCode:result.code,stderr:stderr.slice(-4000)};
  try{return {...JSON.parse(stdout.trim()),providerRevision:AGENTSCOPE_REVISION,capability:AGENTSCOPE_CAPABILITY};}
  catch{return {...evidence,state:'FAIL',code:'AGENTSCOPE_INVALID_RUNNER_OUTPUT',stdout:stdout.slice(-4000),stderr:stderr.slice(-4000)};}
}
