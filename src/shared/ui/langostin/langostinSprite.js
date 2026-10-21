// Sprite de Langostin (32x32 px). Animaciones: idle, wave, work, ok, err, think, point

var C={o:'#3A2018',b:'#C95B3E',d:'#A8442B',l:'#E58B6B',w:'#FFFFFF',g:'#E2B65C',y:'#EBC770',h:'#D0A044',u:'#0F5C80',k:'#F08A6E',s:'#7FD0EB',r:'#E0342F'};
function build(a,f){
var G=[],i,j;for(j=0;j<32;j++)G.push(new Array(32).fill(null));
var oy=2,P=function(x,y,c){y+=oy;if(x>=0&&x<32&&y>=0&&y<32)G[y][x]=c?C[c]:null},
R=function(x,y,w,h,c){for(var q=0;q<h;q++)for(var p=0;p<w;p++)P(x+p,y+q,c)},
Q=function(x,y,c){if(x>=0&&x<32&&y>=0&&y<32)G[y][x]=C[c]},
arm=function(x0,y0,x1,y1){var n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(var t=0;t<=n;t++)R(Math.round(x0+(x1-x0)*t/n),Math.round(y0+(y1-y0)*t/n),2,2,'b')},
claw=function(x,y,open){R(x,y,2,3,'b');R(x+3,y,2,3,'b');if(!open)R(x+2,y,1,3,'d');R(x,y+3,5,2,'b');R(x,y+4,5,1,'d')};
var bob=(f>>2)&1,blink=(f%18)<2,alt=(f>>1)&1,face='n',lx=2,ly=14,lo=0,rx=25,ry=14,ro=0,wr=1,spark=0;
if(a=='idle'){oy+=bob}
if(a=='wave'){oy+=bob;lx=2+alt;ly=5;lo=alt}
if(a=='work'){ry=(f%4<2)?12:16;spark=f%4>=2;oy+=0}
if(a=='ok'){oy+=((f>>1)&1)?-2:0;wr=0;lx=2;ly=5;rx=25;ry=5;lo=ro=alt;face='h'}
if(a=='err'){wr=0;ly=15;ry=15;face='s'}
if(a=='think'){oy+=bob;rx=24;ry=8}
if(a=='point'){oy+=bob;rx=24+alt;ry=10}
R(13,22,6,1,'d');R(11,23,10,1,'d');R(11,24,3,1,'b');R(15,24,2,1,'d');R(18,24,3,1,'b');
R(10,21,2,1,'d');R(20,21,2,1,'d');
arm(8,18,lx+4,ly+3);claw(lx,ly,lo);
arm(22,18,rx,ry+3);claw(rx,ry,ro);
if(a=='think'){for(var d=0;d<((f>>2)%3)+1;d++)R(25+d*2,6-d*2,2,2,'u')}
var rows=[[9,11,20],[10,10,21],[11,9,22],[12,9,22],[13,9,22],[14,9,22],[15,9,22],[16,9,22],[17,10,21],[18,10,21],[19,11,20],[20,12,19],[21,13,18]];
rows.forEach(function(r){R(r[1],r[0],r[2]-r[1]+1,1,'b')});
R(13,17,6,3,'l');R(14,20,4,1,'l');R(13,18,6,1,'d');
R(10,14,1,1,'k');R(21,14,1,1,'k');
if(face=='h'){[[10,12],[11,11],[12,11],[13,12],[18,12],[19,11],[20,11],[21,12]].forEach(function(p){P(p[0],p[1],'o')})}
else if(blink){R(11,12,2,1,'o');R(19,12,2,1,'o')}
else{R(11,11,2,3,'w');R(19,11,2,3,'w');var py=face=='s'?12:11;R(face=='s'?11:12,py,1,2,'o');R(face=='s'?19:20,py,1,2,'o')}
if(face=='s'){[[13,16],[18,16],[14,15],[15,15],[16,15],[17,15]].forEach(function(p){P(p[0],p[1],'o')});var sy=10+(f%4);P(6,sy,'s');P(5,sy+1,'s');P(6,sy+1,'s');P(7,sy+1,'s');if((f>>1)&1)for(var t=0;t<6;t++){Q(24+t,3+t,'r');Q(25+t,3+t,'r');Q(29-t,3+t,'r');Q(30-t,3+t,'r')}}
else{[[13,15],[18,15],[14,16],[15,16],[16,16],[17,16]].forEach(function(p){P(p[0],p[1],'o')})}
R(13,4,6,1,'g');R(11,5,10,1,'g');R(10,6,12,1,'g');R(15,4,2,3,'y');R(10,7,12,1,'u');R(9,8,14,1,'h');
P(12,3,'d');P(11,2,'d');P(10+alt,1,'d');P(19,3,'d');P(20,2,'d');P(21-alt,1,'d');
if(wr){R(27,ry-3,2,9,'u');R(26,ry-6,4,3,'u');R(27,ry-6,2,1,null);if(spark){Q(25,ry-5+oy,'g');Q(30,ry-5+oy,'g');Q(27,ry-8+oy,'y')}}
if(a=='ok'){[[4,2,'g'],[27,1,'u'],[7,0,'k'],[24,3,'s'],[1,8,'y'],[30,6,'g']].forEach(function(c,k){Q(c[0],(c[1]+f+k*2)%12,c[2])})}
var O=G.map(function(r){return r.slice()});
for(j=0;j<32;j++)for(i=0;i<32;i++)if(!G[j][i]){var n=(j>0&&G[j-1][i])||(j<31&&G[j+1][i])||(i>0&&G[j][i-1])||(i<31&&G[j][i+1]);if(n)O[j][i]=C.o}
return O}
function draw(ctx,a,f){var O=build(a,f);ctx.clearRect(0,0,32,32);for(var j=0;j<32;j++)for(var i=0;i<32;i++)if(O[j][i]){ctx.fillStyle=O[j][i];ctx.fillRect(i,j,1,1)}}
function mount(cv,a){cv.width=32;cv.height=32;var ctx=cv.getContext('2d'),f=0;draw(ctx,a,0);return setInterval(function(){f++;draw(ctx,a,f)},140)}

export {build,draw,mount};
export const ANIMS=['idle','wave','work','ok','err','think','point'];
