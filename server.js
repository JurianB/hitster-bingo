/* Hitster Live – lokale server (geen dependencies nodig). Start met: node server.js */
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,PUB=path.join(__dirname,'public'),MAXP=+process.env.MAX_PLAYERS||25,TV_KEY=process.env.TV_KEY||'';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};

/* ---------- netwerkadres voor de QR-code ---------- */
function lanIPs(){
 const out=[];
 for(const [name,list] of Object.entries(os.networkInterfaces()))for(const i of list||[]){
  if(i.family!=='IPv4'||i.internal)continue;
  const a=i.address.split('.').map(Number);
  const priv=a[0]===10||(a[0]===192&&a[1]===168)||(a[0]===172&&a[1]>=16&&a[1]<=31);
  const virt=/vethernet|virtualbox|vmware|wsl|docker|vbox|hyper-v|loopback|tailscale|zerotier/i.test(name);
  out.push({ip:i.address,name,score:(priv?2:0)+(virt?-3:0)+(a[0]===192&&a[1]===168?1:0)});
 }
 return out.sort((x,y)=>y.score-x.score);
}

/* ---------- http ---------- */
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x');let p=decodeURIComponent(u.pathname);
 if(p==='/api/info'){
  const ips=lanIPs();res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});
  return res.end(JSON.stringify({port:PORT,ips,players:players.size,tv:!!tv}));
 }
 const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
 const keyOk=!TV_KEY||u.searchParams.get('key')===TV_KEY;
 if(p==='/')p=(local&&!process.env.RENDER&&!process.env.HOSTED)?'/tv.html':'/play.html';
 else if(p==='/tv'||p==='/tv.html'){if(!keyOk){res.writeHead(403,{'content-type':'text/plain; charset=utf-8'});return res.end('Tv-sleutel ontbreekt: open /tv?key=JOUW_SLEUTEL')}p='/tv.html'}
 else if(p==='/play'||p==='/join')p='/play.html';
 const f=path.normalize(path.join(PUB,p));
 if(!f.startsWith(PUB)){res.writeHead(403);return res.end('Forbidden')}
 fs.readFile(f,(err,buf)=>{
  if(err){res.writeHead(404,{'content-type':'text/plain'});return res.end('Niet gevonden')}
  res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream','cache-control':'no-cache'});res.end(buf);
 });
});

/* ---------- websocket (RFC 6455, minimaal) ---------- */
const GUID='258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
function frame(op,payload){
 const b=Buffer.isBuffer(payload)?payload:Buffer.from(payload);const n=b.length;let h;
 if(n<126)h=Buffer.from([0x80|op,n]);
 else if(n<65536){h=Buffer.alloc(4);h[0]=0x80|op;h[1]=126;h.writeUInt16BE(n,2)}
 else{h=Buffer.alloc(10);h[0]=0x80|op;h[1]=127;h.writeBigUInt64BE(BigInt(n),2)}
 return Buffer.concat([h,b]);
}
class WS{
 constructor(sock){this.sock=sock;this.buf=Buffer.alloc(0);this.frag=[];this.alive=true;this.onmessage=null;this.onclose=null;this.closed=false;
  sock.on('data',d=>this.data(d));sock.on('close',()=>this.end());sock.on('error',()=>this.end());sock.setNoDelay(true)}
 send(obj){if(this.closed)return;try{this.sock.write(frame(1,typeof obj==='string'?obj:JSON.stringify(obj)))}catch(e){}}
 ping(){if(!this.closed)try{this.sock.write(frame(9,''))}catch(e){}}
 close(){if(this.closed)return;try{this.sock.write(frame(8,Buffer.alloc(0)))}catch(e){}this.sock.end();this.end()}
 end(){if(this.closed)return;this.closed=true;try{this.sock.destroy()}catch(e){}this.onclose&&this.onclose()}
 data(d){
  this.buf=Buffer.concat([this.buf,d]);
  for(;;){
   const b=this.buf;if(b.length<2)return;
   const fin=!!(b[0]&0x80),op=b[0]&15,masked=!!(b[1]&0x80);let len=b[1]&127,off=2;
   if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);off=4}
   else if(len===127){if(b.length<10)return;len=Number(b.readBigUInt64BE(2));off=10}
   if(len>65536){return this.close()}
   const need=off+(masked?4:0)+len;if(b.length<need)return;
   let payload=b.subarray(off+(masked?4:0),need);
   if(masked){const m=b.subarray(off,off+4);payload=Buffer.from(payload);for(let i=0;i<payload.length;i++)payload[i]^=m[i&3]}
   this.buf=b.subarray(need);
   if(op===8){return this.close()}
   if(op===9){this.sock.write(frame(10,payload));continue}
   if(op===10){this.alive=true;continue}
   if(op===0||op===1){
    this.frag.push(payload);
    if(fin){const msg=Buffer.concat(this.frag).toString('utf8');this.frag=[];this.alive=true;try{this.onmessage&&this.onmessage(msg)}catch(e){console.error(e)}}
   }
  }
 }
}
server.on('upgrade',(req,sock)=>{
 const u=new URL(req.url,'http://x');
 if(u.pathname!=='/ws'||!req.headers['sec-websocket-key']){sock.destroy();return}
 const role=u.searchParams.get('role');
 if(role==='tv'&&TV_KEY&&u.searchParams.get('key')!==TV_KEY){sock.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');sock.destroy();return}
 const acc=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+GUID).digest('base64');
 sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
 attach(new WS(sock),role);
});

/* ---------- spelkamer: server is alleen post (de tv beslist) ---------- */
let tv=null;                       // WS van het tv-scherm
const players=new Map();           // id -> {ws,name,connected}
const roster=()=>[...players].map(([id,p])=>({id,name:p.name,connected:p.connected}));
const toTV=o=>tv&&tv.send(o);
function attach(ws,role){
 if(role==='tv'){
  if(tv&&tv!==ws){tv.send({t:'replaced'});tv.close()}
  tv=ws;ws.send({t:'roster',players:roster()});
  for(const p of players.values())p.connected&&p.ws.send({t:'tv',on:true});
  ws.onclose=()=>{if(tv===ws){tv=null;for(const p of players.values())p.connected&&p.ws.send({t:'tv',on:false})}};
  ws.onmessage=m=>{
   let o;try{o=JSON.parse(m)}catch{return}
   if(o.t==='to'){const p=players.get(o.id);p&&p.connected&&p.ws.send({t:'msg',data:o.data})}
   else if(o.t==='all'){for(const p of players.values())p.connected&&p.ws.send({t:'msg',data:o.data})}
   else if(o.t==='kick'){const p=players.get(o.id);if(p){p.connected&&(p.ws.send({t:'kicked'}),p.ws.close());players.delete(o.id);toTV({t:'roster',players:roster()})}}
   else if(o.t==='reset'){for(const [id,p] of players){p.connected&&(p.ws.send({t:'kicked'}),p.ws.close())}players.clear();toTV({t:'roster',players:[]})}
  };
  return;
 }
 /* speler */
 let id=null;
 ws.onmessage=m=>{
  let o;try{o=JSON.parse(m)}catch{return}
  if(o.t==='hello'){
   id=String(o.id||'').slice(0,40)||crypto.randomUUID();
   const name=String(o.name||'Speler').slice(0,16)||'Speler';
   const old=players.get(id);
   if(!old&&players.size>=MAXP){ws.send({t:'full'});return ws.close()}
   if(old&&old.connected&&old.ws!==ws){old.ws.onclose=null;old.ws.send({t:'kicked',why:'elders'});old.ws.close()}
   players.set(id,{ws,name,connected:true});
   ws.send({t:'welcome',id,tv:!!tv});
   toTV({t:old?'rejoin':'join',id,name,players:roster()});
  }else if(id){
   if(o.t==='rename'){const p=players.get(id);if(p){p.name=String(o.name||'').slice(0,16)||p.name;toTV({t:'roster',players:roster()})}}
   else toTV({t:'msg',id,data:o});
  }
 };
 ws.onclose=()=>{const p=id&&players.get(id);if(p&&p.ws===ws){p.connected=false;toTV({t:'leave',id,players:roster()})}};
}
setInterval(()=>{
 const all=[...(tv?[tv]:[]),...[...players.values()].filter(p=>p.connected).map(p=>p.ws)];
 for(const ws of all){if(!ws.alive){ws.end();continue}ws.alive=false;ws.ping()}
},15000);

server.listen(PORT,'0.0.0.0',()=>{
 const ips=lanIPs();
 console.log('\n  🎵  HITSTER LIVE draait\n');
 console.log('  Tv (open op deze pc):  http://localhost:'+PORT+'/');
 console.log('  Telefoons joinen via:  '+(ips[0]?'http://'+ips[0].ip+':'+PORT+'/play':'(geen netwerk gevonden)'));
 if(ips.length>1)console.log('  Andere adressen:       '+ips.slice(1).map(i=>i.ip+' ('+i.name+')').join(', '));
 console.log('\n  Stoppen: Ctrl+C\n');
 if(process.env.OPEN_BROWSER||process.argv.includes('--open')){
  const url='http://localhost:'+PORT+'/',cp=require('child_process');
  try{
   if(process.platform==='win32')cp.exec('start "" "'+url+'"');
   else if(process.platform==='darwin')cp.exec('open "'+url+'"');
   else cp.exec('xdg-open "'+url+'"');
  }catch(e){}
 }
});
