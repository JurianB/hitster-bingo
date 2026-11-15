/* Minimale QR-code generator (byte-modus, correctieniveau M, versie 1-10). Geen dependencies. */
(function(g){
 const ECC=[0,10,16,26,18,24,16,18,22,22,26], BLK=[0,1,1,2,2,4,4,4,5,5,5];
 const rawModules=v=>{let r=(16*v+128)*v+64;if(v>=2){const a=Math.floor(v/7)+2;r-=(25*a-10)*a-55;if(v>=7)r-=36}return r};
 const alignPos=v=>{if(v===1)return[];const n=Math.floor(v/7)+2,size=v*4+17,step=Math.ceil((v*4+4)/(n*2-2))*2,r=[6];for(let p=size-7;r.length<n;p-=step)r.splice(1,0,p);return r};
 const EXP=new Array(512),LOG=new Array(256);
 (function(){let x=1;for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11D}for(let i=255;i<512;i++)EXP[i]=EXP[i-255]})();
 const gmul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
 function rsDiv(n){let r=[1];for(let i=0;i<n;i++){const nr=new Array(r.length+1).fill(0);for(let j=0;j<r.length;j++){nr[j]^=r[j];nr[j+1]^=gmul(r[j],EXP[i])}r=nr}return r.slice(1)}
 function rsRem(data,div){const r=new Array(div.length).fill(0);for(const b of data){const f=b^r.shift();r.push(0);for(let i=0;i<div.length;i++)r[i]^=gmul(div[i],f)}return r}
 const bit=(x,i)=>((x>>>i)&1)!==0;
 function matrix(text){
  const bytes=[...new TextEncoder().encode(text)];
  let ver=1;
  for(;ver<=10;ver++){const cap=Math.floor(rawModules(ver)/8)-ECC[ver]*BLK[ver];const lenBits=ver<10?8:16;if(4+lenBits+bytes.length*8<=cap*8)break}
  if(ver>10)throw new Error('QR: tekst te lang');
  const size=ver*4+17,dataCap=Math.floor(rawModules(ver)/8)-ECC[ver]*BLK[ver];
  /* bits */
  const bits=[];const put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1)};
  put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(b=>put(b,8));
  put(0,Math.min(4,dataCap*8-bits.length));while(bits.length%8)bits.push(0);
  const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));
  for(let p=0xEC;data.length<dataCap;p^=0xEC^0x11)data.push(p);
  /* blokken + ecc */
  const nb=BLK[ver],el=ECC[ver],raw=Math.floor(rawModules(ver)/8),ns=nb-raw%nb,sl=Math.floor(raw/nb),div=rsDiv(el),blocks=[];
  for(let i=0,k=0;i<nb;i++){const dat=data.slice(k,k+sl-el+(i<ns?0:1));k+=dat.length;const ecc=rsRem(dat,div);if(i<ns)dat.push(0);blocks.push(dat.concat(ecc))}
  const all=[];for(let i=0;i<blocks[0].length;i++)for(let j=0;j<nb;j++)if(i!==sl-el||j>=ns)all.push(blocks[j][i]);
  /* matrix */
  const m=Array.from({length:size},()=>new Array(size).fill(false)),fn=Array.from({length:size},()=>new Array(size).fill(false));
  const setF=(x,y,d)=>{m[y][x]=d;fn[y][x]=true};
  for(let i=0;i<size;i++){setF(6,i,i%2===0);setF(i,6,i%2===0)}
  const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<size&&y>=0&&y<size)setF(x,y,d!==2&&d!==4)}};
  finder(3,3);finder(size-4,3);finder(3,size-4);
  const ap=alignPos(ver);
  for(let i=0;i<ap.length;i++)for(let j=0;j<ap.length;j++){if((i===0&&j===0)||(i===0&&j===ap.length-1)||(i===ap.length-1&&j===0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)setF(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}
  function fmt(mask){
   const d=(0<<3)|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);
   const b=((d<<10)|r)^0x5412;
   for(let i=0;i<=5;i++)setF(8,i,bit(b,i));setF(8,7,bit(b,6));setF(8,8,bit(b,7));setF(7,8,bit(b,8));
   for(let i=9;i<15;i++)setF(14-i,8,bit(b,i));
   for(let i=0;i<8;i++)setF(size-1-i,8,bit(b,i));
   for(let i=8;i<15;i++)setF(8,size-15+i,bit(b,i));
   setF(8,size-8,true);
  }
  fmt(0);
  if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(ver<<12)|r;for(let i=0;i<18;i++){const c=bit(b,i),a=size-11+i%3,bb=Math.floor(i/3);setF(a,bb,c);setF(bb,a,c)}}
  /* data */
  let k=0;
  for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-vert:vert;if(!fn[y][x]&&k<all.length*8){m[y][x]=bit(all[k>>>3],7-(k&7));k++}}}
  const mask=(n)=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++){let inv;switch(n){case 0:inv=(x+y)%2===0;break;case 1:inv=y%2===0;break;case 2:inv=x%3===0;break;case 3:inv=(x+y)%3===0;break;case 4:inv=(Math.floor(x/3)+Math.floor(y/2))%2===0;break;case 5:inv=x*y%2+x*y%3===0;break;case 6:inv=(x*y%2+x*y%3)%2===0;break;default:inv=((x+y)%2+x*y%3)%2===0}if(!fn[y][x]&&inv)m[y][x]=!m[y][x]}};
  function penalty(){
   let p=0;
   for(let t=0;t<2;t++){
    for(let a=0;a<size;a++){
     let run=1,line='';
     for(let b=0;b<size;b++){const c=t?m[b][a]:m[a][b];line+=c?'1':'0';if(b>0&&c===(t?m[b-1][a]:m[a][b-1])){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}
     const re=/1011101/g;let mm;while((mm=re.exec(line))){const s=mm.index,e=s+7;const before=line.slice(Math.max(0,s-4),s),after=line.slice(e,e+4);if(before==='0000'||after==='0000')p+=40;re.lastIndex=s+1}
    }
   }
   for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=m[y][x];if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1])p+=3}
   let dark=0;for(const r of m)for(const c of r)if(c)dark++;
   p+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10;
   return p;
  }
  let best=0,bp=1e9;
  for(let n=0;n<8;n++){mask(n);fmt(n);const p=penalty();if(p<bp){bp=p;best=n}mask(n)}
  mask(best);fmt(best);
  return m;
 }
 function draw(canvas,text,opt){
  opt=opt||{};const m=matrix(text),n=m.length,q=opt.quiet==null?4:opt.quiet,px=opt.size||320,cell=Math.floor(px/(n+2*q)),W=cell*(n+2*q);
  canvas.width=canvas.height=W;const c=canvas.getContext('2d');
  c.fillStyle=opt.light||'#fff';c.fillRect(0,0,W,W);c.fillStyle=opt.dark||'#000';
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(m[y][x])c.fillRect((x+q)*cell,(y+q)*cell,cell,cell);
 }
 g.QR={matrix,draw};
 if(typeof module!=='undefined')module.exports=g.QR;
})(typeof window!=='undefined'?window:globalThis);
