(()=>{"use strict";class t{constructor(){this.bomb=!1,this.number=0,this.visible=!1,this.flagged=!1,this.hasExploded=!1}isFlagged(){return this.flagged}toggleFlag(){this.flagged=!this.flagged}isVisible(){return this.visible}setVisible(){this.visible=!0}hasBomb(){return this.bomb}setBomb(){this.bomb=!0}setExploded(){this.hasExploded=!0}getExploded(){return this.hasExploded}getNumber(){return this.number}setNumber(t){this.number=t}toString(){return this.bomb?"B":this.number.toString()}drawBomb(t,e,i,s,l,o){t.fillStyle="black",t.beginPath(),t.arc(e,i,s,0,2*Math.PI),t.fill(),t.closePath(),t.lineWidth=4,t.beginPath(),t.moveTo(e,i-s-l),t.lineTo(e,i+s+l),t.stroke(),t.closePath(),t.beginPath(),t.moveTo(e-s-l,i),t.lineTo(e+s+l,i),t.stroke(),t.closePath(),t.beginPath(),t.moveTo(e-s/1.5-l,i-s/1.5-l),t.lineTo(e+s/1.5+l,i+s/1.5+l),t.stroke(),t.closePath(),t.beginPath(),t.moveTo(e+s/1.5+l,i-s/1.5-l),t.lineTo(e-s/1.5-l,i+s/1.5+l),t.stroke(),t.closePath(),t.lineWidth=1;const r=t.createLinearGradient(e-s,i-s,e+s/2,i+s/2);r.addColorStop(0,"grey"),r.addColorStop(1,"black"),t.fillStyle=r,t.beginPath(),t.arc(e,i,s-2,0,2*Math.PI),t.fill(),t.closePath(),o?(t.fillStyle="red",t.beginPath(),t.arc(e,i,s/4,0,2*Math.PI),t.fill(),t.closePath()):(t.fillStyle="black",t.beginPath(),t.arc(e,i,s/4,0,2*Math.PI),t.fill(),t.closePath())}drawCellContent(t,e,i,s){const l=i*s+s/2,o=e*s+s/2,r=s/4;if(this.visible)if(this.hasBomb())this.getExploded()?this.drawBomb(t,l,o,r,4,!0):this.drawBomb(t,l,o,r,4);else{let l="#000000";if(1===this.getNumber())l="blue";else if(2===this.getNumber())l="green";else if(3===this.getNumber())l="red";else if(4===this.getNumber())l="#00008B";else if(5===this.getNumber())l="#8B0000";else if(6===this.getNumber())l="#00FFFF";else if(7===this.getNumber())l="black";else if(8===this.getNumber())l="grey";else if(0===this.getNumber())return;t.fillStyle="#f9f8f5",t.fillRect(i*s,e*s,s,s),t.fillStyle=l,t.font="20px Arial",t.textAlign="center",t.textBaseline="middle",t.fillText(this.toString(),i*s+s/2,e*s+s/2)}else t.fillStyle="#999999",t.fillRect(i*s,e*s,s,s),this.flagged&&(t.fillStyle="#ff0000",t.beginPath(),t.moveTo(l-2,o+r),t.lineTo(l-3.5,o-1),t.stroke(),t.closePath(),t.beginPath(),t.moveTo(l-3,o-1),t.lineTo(l-r/2,o-r-4),t.stroke(),t.lineTo(l+r+4,o-r/2-4),t.stroke(),t.lineTo(l-3,o-1),t.stroke(),t.closePath(),t.fill(),t.beginPath(),t.moveTo(l-8,o+r),t.lineTo(l+4,o+r),t.stroke(),t.closePath())}}class e{DIFFICULTY_NORMAL=.15;constructor(e,i){this.length=e,this.width=i,this.matrix=[];for(let s=0;s<e;s++){let e=[];for(let s=0;s<i;s++){let i=new t;e.push(i)}this.matrix.push(e)}const s=Math.floor(e*i*this.DIFFICULTY_NORMAL);this.numbombs=s,this.placeBombs(s)}get numBomb(){return this.numbombs}placeBombs(t){const e=(t,e)=>Math.floor(Math.random()*(e-t+1))+t;let i=t;for(;i>0;){let t=(0,s=this.length-1,Math.floor(Math.random()*(s-0+1))+0),l=e(0,this.width-1);this.matrix[t][l].hasBomb()||(this.matrix[t][l].setBomb(),this.calculateCellWeight(t,l),i--)}var s}calculateCellWeight(t,e){t-1>=0&&t-1<this.length&&(e-1>=0&&e-1<this.width&&!this.matrix[t-1][e-1].hasBomb()&&this.matrix[t-1][e-1].setNumber(this.matrix[t-1][e-1].getNumber()+1),e>=0&&e<this.width&&!this.matrix[t-1][e].hasBomb()&&this.matrix[t-1][e].setNumber(this.matrix[t-1][e].getNumber()+1),e+1>=0&&e+1<this.width&&!this.matrix[t-1][e+1].hasBomb()&&this.matrix[t-1][e+1].setNumber(this.matrix[t-1][e+1].getNumber()+1)),t>=0&&t<this.length&&(e-1>=0&&e-1<this.width&&!this.matrix[t][e-1].hasBomb()&&this.matrix[t][e-1].setNumber(this.matrix[t][e-1].getNumber()+1),e+1>=0&&e+1<this.width&&!this.matrix[t][e+1].hasBomb()&&this.matrix[t][e+1].setNumber(this.matrix[t][e+1].getNumber()+1)),t+1>=0&&t+1<this.length&&(e-1>=0&&e-1<this.width&&!this.matrix[t+1][e-1].hasBomb()&&this.matrix[t+1][e-1].setNumber(this.matrix[t+1][e-1].getNumber()+1),e>=0&&e<this.width&&!this.matrix[t+1][e].hasBomb()&&this.matrix[t+1][e].setNumber(this.matrix[t+1][e].getNumber()+1),e+1>=0&&e+1<this.width&&!this.matrix[t+1][e+1].hasBomb()&&this.matrix[t+1][e+1].setNumber(this.matrix[t+1][e+1].getNumber()+1))}toString(){let t="";for(let e=0;e<this.length;e++){for(let i=0;i<this.width;i++)t+="| "+this.matrix[e][i].toString()+" |";t+="\n";for(let e=0;e<this.width;e++)t+="-----";t+="\n"}return t}revealCell(t,e,i){if(i)this.matrix[t][e].isVisible()||this.matrix[t][e].getExploded()||this.matrix[t][e].toggleFlag();else if(!this.matrix[t][e].isFlagged()&&!this.matrix[t][e].isVisible()&&(this.matrix[t][e].setVisible(),0===this.matrix[t][e].getNumber()&&!this.matrix[t][e].hasBomb())){const i=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];for(let[s,l]of i){let i=t+s,o=e+l;i>=0&&i<this.length&&o>=0&&o<this.width&&(this.matrix[i][o].isVisible()||this.revealCell(i,o))}}}revealNeighbours(t,e){let i=!1,s=[];const l=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],o=this.matrix[t][e].getNumber();let r=0;for(let[i,s]of l){let l=t+i,o=e+s;l>=0&&l<this.length&&o>=0&&o<this.width&&this.matrix[l][o].isFlagged()&&r++}if(console.log("revealNeighbours:",o,": ",r),r===o)for(let[o,r]of l){let l=t+o,a=e+r;if(l>=0&&l<this.length&&a>=0&&a<this.width&&!this.matrix[l][a].isVisible()&&(this.revealCell(l,a),this.matrix[l][a].hasBomb()&&!this.matrix[l][a].isFlagged())){i=!0;const t=l,e=a;s.push({bombRow:t,bombCol:e})}}return console.log("bombs: ",s),{isBomb:i,bombsList:s}}}document.addEventListener("startVersusGameEvent",(async function(t){const{rows:i,cols:s}=t.detail,l=document.getElementById("minesweeperCanvas"),o=l.getContext("2d");let r=1,a=!1;const h=document.getElementById("timer");let n=null,m=0,b=!1;const g=[],c=document.getElementById("bombsCanvas"),d=c.getContext("2d"),f=i,u=s;console.log(`Rows: ${f}, cols: ${u}`);const x=40;let P=x*u,v=x*f;function w(){b||(n=setInterval((()=>{m++,h.innerHTML=m.toString()}),1e3),b=!0)}function B(){b=!1,clearInterval(n)}function N(t){console.log(`Game ended with result: ${t}`),document.dispatchEvent(new CustomEvent("endVersusGame",{detail:{result:t}}))}function T(){for(let t=0;t<f;t++)for(let e=0;e<u;e++)if(E.matrix[t][e].hasBomb()&&!E.matrix[t][e].isVisible()&&!E.matrix[t][e].isFlagged())return!1;return!0}function C(){l.removeEventListener("click",k),l.removeEventListener("contextmenu",M)}function p(t,e){g.push(5),m+=5,E.matrix[t][e].setExploded(),E.matrix[t][e].isFlagged()||E.matrix[t][e].toggleFlag(),E.matrix[t][e].isVisible(),E.matrix[t][e].drawCellContent(o,t,e,x),L.innerHTML=(parseInt(L.innerHTML)-1).toString()}function k(t){const e=l.getBoundingClientRect(),i=t.clientX-e.left,s=t.clientY-e.top,h=Math.floor(s/x*r),n=Math.floor(i/x*r);if(console.log(`Left-clicked on cell (${h}, ${n}), Visible: ${E.matrix[h][n].isVisible()}, Flagged: ${E.matrix[h][n].isFlagged()}`),w(),E.matrix[h][n].isVisible()){if(E.matrix[h][n].getNumber()>0&&!E.matrix[h][n].hasBomb()){const{isBomb:t,bombsList:e}=E.revealNeighbours(h,n);if(console.log(`isBomb: ${t}, bombList: ${e}`),t)for(const t of e){const e=t.bombRow,i=t.bombCol;E.matrix[e][i].getExploded()||p(e,i)}}}else E.revealCell(h,n,!1);o.clearRect(0,0,l.width,l.height);for(let t=0;t<f;t++)for(let e=0;e<u;e++)E.matrix[t][e].drawCellContent(o,t,e,x),o.strokeRect(e*x,t*x,x,x);!function(t,e){if(!E.matrix[t][e].isFlagged())return E.matrix[t][e].hasBomb()}(h,n)?T()&&(a=!0,B(),S=!0,C(),N(m)):E.matrix[h][n].getExploded()||p(h,n)}function M(t){t.preventDefault();const e=l.getBoundingClientRect(),i=t.clientX-e.left,s=t.clientY-e.top,r=Math.floor(s/x),h=Math.floor(i/x);console.log(`Right-clicked on cell (${r}, ${h}, ${E.matrix[r][h].getExploded()})`),w(),E.revealCell(r,h,!0),o.clearRect(0,0,l.width,l.height);for(let t=0;t<f;t++)for(let e=0;e<u;e++)E.matrix[t][e].drawCellContent(o,t,e,x),o.strokeRect(e*x,t*x,x,x);E.matrix[r][h].isVisible()||!E.matrix[r][h].isFlagged()||E.matrix[r][h].getExploded()||(L.innerHTML=(parseInt(L.innerHTML)-1).toString()),E.matrix[r][h].isVisible()||E.matrix[r][h].isFlagged()||(L.innerHTML=(parseInt(L.innerHTML)+1).toString()),T()&&(a=!0,B(),console.log("Game Over! You win!"),S=!0,C(),N(m))}l.width=P,l.height=v;let S=!1;l.addEventListener("click",k),l.addEventListener("contextmenu",M);const E=new e(f,u);c.width=x,c.height=x,function(t,e,i,s,l){t.fillStyle="black",t.beginPath(),t.arc(e,i,s,0,2*Math.PI),t.fill(),t.closePath(),t.lineWidth=4,t.beginPath(),t.moveTo(e,i-s-4),t.lineTo(e,i+s+4),t.stroke(),t.closePath(),t.beginPath(),t.moveTo(e-s-4,i),t.lineTo(e+s+4,i),t.stroke(),t.closePath(),t.beginPath(),t.moveTo(e-s/1.5-4,i-s/1.5-4),t.lineTo(e+s/1.5+4,i+s/1.5+4),t.stroke(),t.closePath(),t.beginPath(),t.moveTo(e+s/1.5+4,i-s/1.5-4),t.lineTo(e-s/1.5-4,i+s/1.5+4),t.stroke(),t.closePath(),t.lineWidth=1;const o=t.createLinearGradient(e-s,i-s,e+s/2,i+s/2);o.addColorStop(0,"grey"),o.addColorStop(1,"black"),t.fillStyle=o,t.beginPath(),t.arc(e,i,s-2,0,2*Math.PI),t.fill(),t.closePath(),t.fillStyle="black",t.beginPath(),t.arc(e,i,s/4,0,2*Math.PI),t.fill(),t.closePath()}(d,x/2,x/2,x/4);let L=document.getElementById("bombs");L.innerHTML=E.numbombs.toString();for(let t=0;t<f;t++)for(let e=0;e<u;e++)E.matrix[t][e].drawCellContent(o,t,e,x),o.strokeRect(e*x,t*x,x,x)}))})();