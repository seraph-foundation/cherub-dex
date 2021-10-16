(this.webpackJsonpapp=this.webpackJsonpapp||[]).push([[0],{121:function(e){e.exports=JSON.parse('{"version":"0.0.0","name":"exchange","instructions":[{"name":"create","accounts":[{"name":"exchange","isMut":true,"isSigner":false},{"name":"factory","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false}],"args":[{"name":"tokenA","type":"publicKey"},{"name":"tokenB","type":"publicKey"},{"name":"tokenC","type":"publicKey"},{"name":"fee","type":"u64"}]},{"name":"bond","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"clock","isMut":false,"isSigner":false},{"name":"exchange","isMut":true,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false},{"name":"exchangeV","isMut":true,"isSigner":false},{"name":"mint","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"userA","isMut":true,"isSigner":false},{"name":"userB","isMut":true,"isSigner":false},{"name":"userC","isMut":true,"isSigner":false},{"name":"userV","isMut":true,"isSigner":false}],"args":[{"name":"maxAmountA","type":"u64"},{"name":"amountB","type":"u64"},{"name":"minLiquidityC","type":"u64"},{"name":"deadline","type":"i64"}]},{"name":"unbond","accounts":[{"name":"authority","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false},{"name":"pda","isMut":false,"isSigner":false},{"name":"exchange","isMut":true,"isSigner":false},{"name":"mint","isMut":true,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false},{"name":"userA","isMut":true,"isSigner":false},{"name":"userB","isMut":true,"isSigner":false},{"name":"userC","isMut":true,"isSigner":false}],"args":[{"name":"amountC","type":"u64"},{"name":"deadline","type":"i64"}]},{"name":"getBToAInputPrice","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"exchange","isMut":false,"isSigner":false},{"name":"quote","isMut":true,"isSigner":true},{"name":"exchangeA","isMut":false,"isSigner":false},{"name":"exchangeB","isMut":false,"isSigner":false}],"args":[{"name":"amountB","type":"u64"}]},{"name":"getBToAOutputPrice","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"exchange","isMut":false,"isSigner":false},{"name":"quote","isMut":true,"isSigner":true},{"name":"exchangeA","isMut":false,"isSigner":false},{"name":"exchangeB","isMut":false,"isSigner":false}],"args":[{"name":"amountA","type":"u64"}]},{"name":"bToAInput","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"clock","isMut":false,"isSigner":false},{"name":"exchange","isMut":true,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false},{"name":"recipient","isMut":true,"isSigner":false},{"name":"pda","isMut":false,"isSigner":false},{"name":"position","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"userA","isMut":true,"isSigner":false},{"name":"userB","isMut":true,"isSigner":false}],"args":[{"name":"amountB","type":"u64"},{"name":"deadline","type":{"option":"i64"}},{"name":"direction","type":{"defined":"Direction"}},{"name":"equity","type":"u64"}]},{"name":"aToBInput","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"clock","isMut":false,"isSigner":false},{"name":"exchange","isMut":true,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false},{"name":"recipient","isMut":true,"isSigner":false},{"name":"pda","isMut":false,"isSigner":false},{"name":"position","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"userA","isMut":true,"isSigner":false},{"name":"userB","isMut":true,"isSigner":false}],"args":[{"name":"amountA","type":"u64"},{"name":"deadline","type":{"option":"i64"}},{"name":"direction","type":{"defined":"Direction"}},{"name":"equity","type":"u64"}]},{"name":"bToAOutput","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"clock","isMut":false,"isSigner":false},{"name":"exchange","isMut":true,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false},{"name":"recipient","isMut":true,"isSigner":false},{"name":"pda","isMut":false,"isSigner":false},{"name":"position","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"userA","isMut":true,"isSigner":false},{"name":"userB","isMut":true,"isSigner":false}],"args":[{"name":"amountB","type":"u64"},{"name":"deadline","type":{"option":"i64"}}]},{"name":"aToBOutput","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"clock","isMut":false,"isSigner":false},{"name":"exchange","isMut":true,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false},{"name":"recipient","isMut":true,"isSigner":false},{"name":"pda","isMut":false,"isSigner":false},{"name":"position","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"userA","isMut":true,"isSigner":false},{"name":"userB","isMut":true,"isSigner":false}],"args":[{"name":"amountA","type":"u64"},{"name":"deadline","type":{"option":"i64"}}]}],"accounts":[{"name":"ExchangeData","type":{"kind":"struct","fields":[{"name":"factory","type":"publicKey"},{"name":"fee","type":"u64"},{"name":"lastPrice","type":"u64"},{"name":"tokenA","type":"publicKey"},{"name":"tokenB","type":"publicKey"},{"name":"tokenC","type":"publicKey"}]}},{"name":"Quote","type":{"kind":"struct","fields":[{"name":"price","type":"u64"}]}},{"name":"PositionData","type":{"kind":"struct","fields":[{"name":"direction","type":{"defined":"Direction"}},{"name":"entry","type":"u64"},{"name":"equity","type":"u64"},{"name":"exit","type":"u64"},{"name":"status","type":{"defined":"Status"}},{"name":"quantity","type":"u64"},{"name":"unixTimestamp","type":"i64"}]}}],"types":[{"name":"Direction","type":{"kind":"enum","variants":[{"name":"Long"},{"name":"Short"}]}},{"name":"Status","type":{"kind":"enum","variants":[{"name":"Open"},{"name":"Closed"},{"name":"Liquidated"}]}}],"errors":[{"code":300,"name":"FutureDeadline","msg":"Adding or removing liquidity must be done in the present or at a future time"},{"code":301,"name":"CorrectTokens","msg":"Incorrect tokens"}],"metadata":{"address":"Gx9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"}}')},209:function(e){e.exports=JSON.parse('{"version":"0.0.0","name":"factory","instructions":[{"name":"initialize","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"factory","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"template","type":"publicKey"}]},{"name":"createExchange","accounts":[{"name":"exchange","isMut":true,"isSigner":false},{"name":"exchangeA","isMut":true,"isSigner":false},{"name":"exchangeB","isMut":true,"isSigner":false},{"name":"exchangeProgram","isMut":false,"isSigner":false},{"name":"factory","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[{"name":"tokenA","type":"publicKey"},{"name":"tokenB","type":"publicKey"},{"name":"tokenC","type":"publicKey"},{"name":"fee","type":"u64"}]},{"name":"getExchange","accounts":[{"name":"factory","isMut":false,"isSigner":false}],"args":[{"name":"token","type":"publicKey"}]},{"name":"getToken","accounts":[{"name":"factory","isMut":false,"isSigner":false}],"args":[{"name":"token","type":"publicKey"}]},{"name":"getTokenWithId","accounts":[{"name":"factory","isMut":false,"isSigner":false}],"args":[{"name":"token","type":"publicKey"}]},{"name":"stake","accounts":[{"name":"authority","isMut":false,"isSigner":false},{"name":"factory","isMut":false,"isSigner":false},{"name":"factoryC","isMut":true,"isSigner":false},{"name":"mintS","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"userS","isMut":true,"isSigner":false},{"name":"userC","isMut":true,"isSigner":false}],"args":[{"name":"amountC","type":"u64"}]}],"accounts":[{"name":"FactoryData","type":{"kind":"struct","fields":[{"name":"exchangeTemplate","type":"publicKey"},{"name":"tokenCount","type":"u64"}]}}],"metadata":{"address":"GyuPaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"}}')},494:function(e,t,n){"use strict";(function(e){var a=n(1),s=n.n(a),c=n(7),r=n(23),i=n(211),o=n(155),l=n(364),u=n(969),b=n(362),d=n(210),j=n(135),m=n(69),p=n(76),f=n(40),x=n(156),h=n(365),g=n(366),O=n(970),y=n(188),S=n(973),k=n(972),M=n(971),w=n(974),C=n(134),v=n(148),A=n(363),N=n(976),P=n(60),B=n(0),K=n(361),D=n(124),F=n(358),T=n(285),L=n(28),W=n(35),q=(n(887),n(888),n(121)),V=n(209),E=n(9),I={};I="http://127.0.0.1:3000"===window.location.origin?n(890):n(891);var J=i.a.Content,H=i.a.Footer,Q=i.a.Header,Y=o.a.Option,G=l.a.Step,z=u.a.Title,U={Long:{long:{}},Short:{short:{}}},R=I.exchanges.find((function(e){return"CHRB"===e.symbol})),X=I.exchanges.find((function(e){return"SOL"===e.symbol})),Z="https://www.github.com/cherub-so/cherub-protocol",_="http://127.0.0.1:3000"===window.location.origin?"http://127.0.0.1:8899":Object(L.clusterApiUrl)("devnet"),$="processed",ee="http://127.0.0.1:8899"!==_,te=[Object(T.getPhantomWallet)(),Object(T.getSolletWallet)(),Object(T.getSlopeWallet)()],ne="stake"===oe()?R.symbol:X.symbol,ae={scales:{x:{display:!0,grid:{display:!1}},y:{display:!0,grid:{display:!1}}},plugins:{legend:{display:!1}}},se=[{title:"Move SOL/COPE stake to SOL/MANGO",description:"4 \u2022 September 25th, 2021",icon:Object(E.jsx)(w.a,{className:"ClockCircleOutlined"})},{title:"Contributor Grant: Tim Su",description:"3 \u2022 Executed September 12th, 2021",icon:Object(E.jsx)(C.a,{className:"CheckCircleOutlined"})},{title:"Add AAVE, SUSHI, YFI",description:"2 \u2022 Executed September 2nd, 2021",icon:Object(E.jsx)(v.a,{className:"CloseCircleOutlined"})},{title:"Set Pause Guardian to Community Multi-Sig",description:"1 \u2022 Executed September 1st, 2021",icon:Object(E.jsx)(C.a,{className:"CheckCircleOutlined"})}],ce={labels:["Jan","Feb","Mar","Apr","May","Jun"],datasets:[{data:[0,7,6,10,24,51,54,176],fill:!0,borderColor:"#40a9ff",backgroundColor:"#69c0ff"}]},re={labels:["Jan","Feb","Mar","Apr","May","Jun"],datasets:[{data:[0,5,10,33,35,51,54,76],fill:!0,borderColor:"#40a9ff",backgroundColor:"#69c0ff"}]};function ie(e){return"$"+e.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1,")}function oe(){var e=["dao","inverse","stake","bond"];return 2===window.location.href.split("#/").length&&e.indexOf(window.location.href.split("#/")[1])>=0?window.location.href.split("#/")[1]:e[0]}function le(){var t=Object(B.useState)(0),n=Object(r.a)(t,2),a=n[0],u=n[1],w=Object(B.useState)(0),C=Object(r.a)(w,2),v=C[0],T=C[1],te=Object(B.useState)(!1),le=Object(r.a)(te,2),ue=le[0],be=le[1],de=Object(B.useState)(),je=Object(r.a)(de,2),me=je[0],pe=je[1],fe=Object(B.useState)("0 / 0"),xe=Object(r.a)(fe,2),he=xe[0],ge=xe[1],Oe=Object(B.useState)(0),ye=Object(r.a)(Oe,2),Se=ye[0],ke=ye[1],Me=Object(B.useState)(0),we=Object(r.a)(Me,2),Ce=we[0],ve=we[1],Ae=Object(B.useState)(),Ne=Object(r.a)(Ae,2),Pe=Ne[0],Be=Ne[1],Ke=Object(B.useState)(""),De=Object(r.a)(Ke,2),Fe=De[0],Te=De[1],Le=Object(B.useState)(!1),We=Object(r.a)(Le,2),qe=We[0],Ve=We[1],Ee=Object(B.useState)({accountV:null,token:null,symbol:null}),Ie=Object(r.a)(Ee,2),Je=Ie[0],He=Ie[1],Qe=Object(B.useState)(),Ye=Object(r.a)(Qe,2),Ge=Ye[0],ze=Ye[1],Ue=Object(B.useState)("statistics"),Re=Object(r.a)(Ue,2),Xe=Re[0],Ze=Re[1],_e=Object(B.useState)(0),$e=Object(r.a)(_e,2),et=$e[0],tt=$e[1],nt=Object(B.useState)(),at=Object(r.a)(nt,2),st=at[0],ct=at[1],rt=Object(B.useState)(),it=Object(r.a)(rt,2),ot=it[0],lt=(it[1],Object(B.useState)()),ut=Object(r.a)(lt,2),bt=ut[0],dt=ut[1],jt=Object(B.useState)(!1),mt=Object(r.a)(jt,2),pt=mt[0],ft=mt[1],xt=Object(B.useState)(!1),ht=Object(r.a)(xt,2),gt=ht[0],Ot=ht[1],yt=Object(B.useState)(),St=Object(r.a)(yt,2),kt=St[0],Mt=St[1],wt=Object(B.useState)(ne),Ct=Object(r.a)(wt,2),vt=Ct[0],At=Ct[1],Nt=Object(B.useState)("inverse"),Pt=Object(r.a)(Nt,2),Bt=Pt[0],Kt=Pt[1],Dt=Object(B.useState)("long"),Ft=Object(r.a)(Dt,2),Tt=Ft[0],Lt=Ft[1],Wt=Object(B.useState)(),qt=Object(r.a)(Wt,2),Vt=qt[0],Et=qt[1],It=Object(B.useState)(0),Jt=Object(r.a)(It,2),Ht=Jt[0],Qt=Jt[1],Yt=Object(B.useState)(1),Gt=Object(r.a)(Yt,2),zt=Gt[0],Ut=Gt[1],Rt=Object(B.useState)(),Xt=Object(r.a)(Rt,2),Zt=Xt[0],_t=Xt[1],$t=Object(B.useState)(""),en=Object(r.a)($t,2),tn=en[0],nn=en[1],an=Object(B.useState)("stake"),sn=Object(r.a)(an,2),cn=sn[0],rn=sn[1],on=Object(B.useState)(),ln=Object(r.a)(on,2),un=ln[0],bn=ln[1],dn=Object(B.useState)(0),jn=Object(r.a)(dn,2),mn=jn[0],pn=jn[1],fn=Object(B.useState)(0),xn=Object(r.a)(fn,2),hn=xn[0],gn=xn[1],On=Object(B.useState)(),yn=Object(r.a)(On,2),Sn=yn[0],kn=yn[1],Mn=Object(D.useWallet)(),wn=Object(B.useCallback)(Pn,[Pn]),Cn=Object(B.useCallback)((function(){return Kn.apply(this,arguments)}),[wn,Je.token,Je.accountV,Mn.connected,Mn.publicKey]),vn=Object(B.useCallback)((function(){return Fn.apply(this,arguments)}),[wn]),An=Object(B.useCallback)((function(){return Dn.apply(this,arguments)}),[wn]),Nn=Object(B.useCallback)(Wn,[wn]);function Pn(){return Bn.apply(this,arguments)}function Bn(){return(Bn=Object(c.a)(s.a.mark((function e(){var t;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=new L.Connection(_,$),e.abrupt("return",new P.c(t,Mn,$));case 2:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function Kn(){return(Kn=Object(c.a)(s.a.mark((function e(){var t,n,a,c,r;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,wn();case 2:if(t=e.sent,!Mn.connected){e.next=19;break}if(Je.token!==X.token){e.next=11;break}return e.next=7,t.connection.getBalance(Mn.publicKey);case 7:n=e.sent,u(n/L.LAMPORTS_PER_SOL),e.next=19;break;case 11:return a=new W.c(t.connection,new L.PublicKey(Je.token),W.b),e.next=14,a.getAccountInfo(new L.PublicKey(Je.accountV));case 14:return c=e.sent,e.next=17,a.getMintInfo();case 17:r=e.sent,u((c.amount.toNumber()/Math.pow(10,r.decimals)).toFixed(2));case 19:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function Dn(){return(Dn=Object(c.a)(s.a.mark((function e(){var t,n,a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,wn();case 2:return t=e.sent,n=new P.b(V,new L.PublicKey(V.metadata.address),t),e.prev=4,e.next=7,n.account.factoryData.fetch(new L.PublicKey(I.factory.account));case 7:a=e.sent,gn(a.tokenCount.toNumber()),e.next=14;break;case 11:e.prev=11,e.t0=e.catch(4),console.log("Transaction error: ",e.t0);case 14:case"end":return e.stop()}}),e,null,[[4,11]])})))).apply(this,arguments)}function Fn(){return(Fn=Object(c.a)(s.a.mark((function e(){var t,n,a,c,r,i,o,l,u,b;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,wn();case 2:return t=e.sent,n=new P.b(q,new L.PublicKey(q.metadata.address),t),e.prev=4,a=new W.c(t.connection,new L.PublicKey(I.factory.tokenC),W.b),c=new W.c(t.connection,new L.PublicKey(I.factory.tokenS),W.b),e.next=9,a.getMintInfo();case 9:return r=e.sent,e.next=12,c.getMintInfo();case 12:return i=e.sent,o=i.supply.toNumber()/Math.pow(10,i.decimals),l=r.supply.toNumber()/Math.pow(10,r.decimals),ge(o.toFixed(0)+" / "+l.toFixed(0)),e.next=18,n.account.exchangeData.fetch(new L.PublicKey(R.account));case 18:u=e.sent,b=(u.lastPrice.toNumber()/Math.pow(10,r.decimals)).toFixed(2),ke(ie(b/1)),ve(ie(b*l)),e.next=27;break;case 24:e.prev=24,e.t0=e.catch(4),console.log("Transaction error: ",e.t0);case 27:case"end":return e.stop()}}),e,null,[[4,24]])})))).apply(this,arguments)}function Tn(){b.b.info("Unable to connect to network")}function Ln(e){var t=e*(Math.random()/100+.9);Be("+"+(e>0?(Math.random()/100+2).toFixed(2):0)),ze(e),ct(e>0?((e-t)/1e3).toFixed(4):0),dt((e*(Math.random()/100+1.1)).toFixed(2)),Mt(t.toFixed(2)),_t((e*(Math.random()/100+.9)).toFixed(2)),kn((e*(1e4*Math.random()+1.3)).toFixed(0))}function Wn(e){return qn.apply(this,arguments)}function qn(){return(qn=Object(c.a)(s.a.mark((function e(t){var n,a,c,r,i,o,l,u;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,wn();case 2:return n=e.sent,a=new L.PublicKey(I.exchanges.find((function(e){return e.symbol===t})).account),c=new P.b(q,new L.PublicKey(q.metadata.address),n),e.prev=5,e.next=8,c.account.exchangeData.fetch(a);case 8:return r=e.sent,i=I.exchanges.find((function(e){return e.symbol===t})).tokenA,o=new W.c(n.connection,new L.PublicKey(i),W.b,null),e.next=13,o.getMintInfo();case 13:l=e.sent,Ln(u=(r.lastPrice.toNumber()/Math.pow(10,l.decimals)).toFixed(2)),tt(u),e.next=22;break;case 19:e.prev=19,e.t0=e.catch(5),console.log("Transaction error: ",e.t0);case 22:Qt(0),Et();case 24:case"end":return e.stop()}}),e,null,[[5,19]])})))).apply(this,arguments)}function Vn(){return(Vn=Object(c.a)(s.a.mark((function t(){var n,a,c,i,o,l,u,b,j,m,p,f,x,h,g,O;return s.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,wn();case 2:return n=t.sent,a=new P.b(q,new L.PublicKey(q.metadata.address),n),c=new L.PublicKey(Je.account),i=new W.c(n.connection,new L.PublicKey(Je.tokenA),W.b),o=new W.c(n.connection,new L.PublicKey(Je.tokenB),W.b),t.next=9,i.getMintInfo();case 9:return l=t.sent,t.next=12,W.c.getAssociatedTokenAddress(W.a,W.b,i.publicKey,n.wallet.publicKey);case 12:return u=t.sent,t.next=15,W.c.getAssociatedTokenAddress(W.a,W.b,o.publicKey,n.wallet.publicKey);case 15:return b=t.sent,j=L.Keypair.generate(),t.next=19,L.PublicKey.findProgramAddress([e.from(P.e.bytes.utf8.encode("exchange"))],a.programId);case 19:return m=t.sent,p=Object(r.a)(m,2),f=p[0],p[1],x=new P.a(Vt*zt*Math.pow(10,l.decimals)),h=new P.a(Vt*Math.pow(10,l.decimals)),t.prev=25,t.next=28,a.rpc.aToBInput(x,new P.a(Date.now()+5),"long"===Tt?U.Long:U.Short,h,{accounts:{authority:n.wallet.publicKey,clock:L.SYSVAR_CLOCK_PUBKEY,exchange:c,exchangeA:Je.accountA,exchangeB:Je.accountB,pda:f,position:j.publicKey,recipient:u,systemProgram:L.SystemProgram.programId,tokenProgram:W.b,userA:u,userB:b},signers:[j]});case 28:g=t.sent,O="https://explorer.solana.com/tx/"+g,d.a.open({message:"Order Successfully Placed",description:Object(E.jsxs)("div",{children:["Your transaction signature is ",Object(E.jsx)("a",{href:O,rel:"noreferrer",target:"_blank",children:Object(E.jsx)("code",{children:g})})]}),duration:0,placement:"bottomLeft"}),Qt(0),Ut(1),Et(),Nn(Je.symbol),t.next=40;break;case 37:t.prev=37,t.t0=t.catch(25),console.log("Transaction error: ",t.t0);case 40:case"end":return t.stop()}}),t,null,[[25,37]])})))).apply(this,arguments)}function En(){return(En=Object(c.a)(s.a.mark((function t(){var n,a,c,i,o,l,u,b,j,m,p,f,x,h,g,O,y,S,k;return s.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,wn();case 2:return n=t.sent,a=new P.b(q,new L.PublicKey(q.metadata.address),n),c=new W.c(n.connection,new L.PublicKey(Je.tokenA),W.b),i=new W.c(n.connection,new L.PublicKey(Je.tokenB),W.b),o=new W.c(n.connection,new L.PublicKey(I.factory.tokenC),W.b),l=new W.c(n.connection,new L.PublicKey(Je.tokenV),W.b),t.next=10,c.getMintInfo();case 10:return u=t.sent,t.next=13,i.getMintInfo();case 13:return b=t.sent,t.next=16,W.c.getAssociatedTokenAddress(W.a,W.b,c.publicKey,n.wallet.publicKey);case 16:return j=t.sent,t.next=19,W.c.getAssociatedTokenAddress(W.a,W.b,i.publicKey,n.wallet.publicKey);case 19:return m=t.sent,t.next=22,W.c.getAssociatedTokenAddress(W.a,W.b,o.publicKey,n.wallet.publicKey);case 22:return p=t.sent,t.next=25,W.c.getAssociatedTokenAddress(W.a,W.b,l.publicKey,n.wallet.publicKey);case 25:return f=t.sent,t.next=28,L.PublicKey.findProgramAddress([e.from(P.e.bytes.utf8.encode("exchange"))],a.programId);case 28:return x=t.sent,h=Object(r.a)(x,2),h[0],h[1],g=me*Math.pow(10,u.decimals),O=g/(Ge*Math.pow(10,u.decimals))*Math.pow(10,b.decimals),y=O/1e3,t.prev=35,t.next=38,a.rpc.bond(new P.a(g.toFixed(0)),new P.a(O.toFixed(0)),new P.a(y.toFixed(0)),new P.a(Date.now()+5),{accounts:{authority:n.wallet.publicKey,clock:L.SYSVAR_CLOCK_PUBKEY,exchange:Je.account,exchangeA:Je.accountA,exchangeB:Je.accountB,exchangeV:Je.accountV,mint:new L.PublicKey(I.factory.tokenC),tokenProgram:W.b,userA:j,userB:m,userC:p,userV:f},signers:[n.wallet.owner]});case 38:S=t.sent,k="https://explorer.solana.com/tx/"+S,d.a.open({message:"Order Successfully Placed",description:Object(E.jsxs)("div",{children:["Your transaction signature is ",Object(E.jsx)("a",{href:k,rel:"noreferrer",target:"_blank",children:Object(E.jsx)("code",{children:S})})]}),duration:0,placement:"bottomLeft"}),pe(),Nn(Je.symbol),t.next=48;break;case 45:t.prev=45,t.t0=t.catch(35),console.log("Transaction error: ",t.t0);case 48:case"end":return t.stop()}}),t,null,[[35,45]])})))).apply(this,arguments)}function In(){return(In=Object(c.a)(s.a.mark((function e(){var t,n,a,c,r,i,o,l,u,b;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,wn();case 2:return t=e.sent,n=new P.b(V,new L.PublicKey(V.metadata.address),t),a=new W.c(t.connection,new L.PublicKey(I.factory.tokenC),W.b),c=new W.c(t.connection,new L.PublicKey(I.factory.tokenS),W.b),e.next=8,a.getMintInfo();case 8:return r=e.sent,e.next=11,W.c.getAssociatedTokenAddress(W.a,W.b,a.publicKey,t.wallet.publicKey);case 11:return i=e.sent,e.next=14,W.c.getAssociatedTokenAddress(W.a,W.b,c.publicKey,t.wallet.publicKey);case 14:return o=e.sent,l=new P.a(un*Math.pow(10,r.decimals)),e.prev=16,e.next=19,n.rpc.stake(new P.a(l),{accounts:{authority:t.wallet.publicKey,factory:new L.PublicKey(I.factory),factoryC:new L.PublicKey(I.factoryC),mintS:c.publicKey,tokenProgram:W.b,userC:i,userS:o},signers:[t.wallet.owner]});case 19:u=e.sent,b="https://explorer.solana.com/tx/"+u,d.a.open({message:"Order Successfully Placed",description:Object(E.jsxs)("div",{children:["Your transaction signature is ",Object(E.jsx)("a",{href:b,rel:"noreferrer",target:"_blank",children:Object(E.jsx)("code",{children:u})})]}),duration:0,placement:"bottomLeft"}),pn(0),bn(),e.next=29;break;case 26:e.prev=26,e.t0=e.catch(16),console.log("Transaction error: ",e.t0);case 29:case"end":return e.stop()}}),e,null,[[16,26]])})))).apply(this,arguments)}var Jn=Object(E.jsxs)(j.a,{children:[Object(E.jsx)(j.a.Item,{onClick:function(){return window.open(Z,"_blank")},children:"GitHub"},"github"),Object(E.jsx)(j.a.Item,{children:"Discord"},"discord")]}),Hn=Object(E.jsxs)(m.a,{className:"AssetTitleModal",type:"link",onClick:function(){return ft(!0)},children:[vt," ",Object(E.jsx)(A.a,{})]}),Qn=Object(E.jsxs)(p.a,{className:"InverseStatsBar",children:[Object(E.jsx)(f.a,{span:3}),Object(E.jsxs)(f.a,{span:3,children:[Object(E.jsx)("p",{children:Object(E.jsx)("small",{children:"Market / Index"})}),Object(E.jsxs)(z,{level:5,className:"Title Dark Green",children:[Ge,Object(E.jsxs)("span",{className:"White",children:[" / ",kt]})]})]}),Object(E.jsxs)(f.a,{span:3,children:[Object(E.jsx)("p",{children:Object(E.jsx)("small",{children:"24H Change (%)"})}),Object(E.jsx)(z,{level:5,className:"Title Dark Green",children:Pe})]}),Object(E.jsxs)(f.a,{span:3,children:[Object(E.jsx)("p",{children:Object(E.jsx)("small",{children:"24H High"})}),Object(E.jsx)(z,{level:5,className:"Title Dark",children:bt})]}),Object(E.jsxs)(f.a,{span:3,children:[Object(E.jsx)("p",{children:Object(E.jsx)("small",{children:"24H Low"})}),Object(E.jsx)(z,{level:5,className:"Title Dark",children:Zt})]}),Object(E.jsxs)(f.a,{span:3,children:[Object(E.jsx)("p",{children:Object(E.jsxs)("small",{children:["24H Turnaround (",vt,")"]})}),Object(E.jsx)(z,{level:5,className:"Title Dark",children:Sn})]}),Object(E.jsxs)(f.a,{span:3,children:[Object(E.jsx)("p",{children:Object(E.jsx)("small",{children:"Funding (%) / Countdown"})}),Object(E.jsxs)(z,{level:5,className:"Title Dark",children:[Object(E.jsx)("span",{className:"Yellow",children:st})," / ",Fe]})]}),Object(E.jsx)(f.a,{span:3})]}),Yn=Object(E.jsxs)("small",{children:["Your order amount of ",Object(E.jsxs)("span",{className:"White",children:[Vt>0?(Vt/1).toFixed(2):0," USD"]})," equals ",Object(E.jsxs)("span",{className:"White",children:[Vt>0?(Vt/Ge).toFixed(2):0," ",vt]})]}),Gn=Object(E.jsxs)("small",{children:["This transaction requires ",Object(E.jsxs)("span",{className:"White",children:[ot>0?(ot/1).toFixed(2):0," SOL"]})]}),zn=Object(E.jsxs)("small",{children:["At ",Object(E.jsxs)("span",{className:"White",children:[zt,"x"]})," leverage your position is worth ",Object(E.jsxs)("span",{className:"White",children:[Vt>0?(Vt/Ge*zt).toFixed(2):0," ",vt]})]}),Un=Object(E.jsxs)(E.Fragment,{children:[Qn,Object(E.jsx)("br",{}),Object(E.jsxs)(p.a,{children:[Object(E.jsx)(f.a,{span:6}),"inverse"===Bt?Object(E.jsxs)(E.Fragment,{children:[Object(E.jsx)(f.a,{span:8,className:"Cards",children:Object(E.jsx)("div",{className:"site-card-border-less-wrapper",children:Object(E.jsxs)(x.a,{title:Hn,className:"Card Dark",bordered:!1,extra:Object(E.jsx)("a",{href:"/#/inverse",className:"CardLink",onClick:function(){return Kt("positions")},children:"Positions"}),children:[Object(E.jsx)("p",{children:Object(E.jsx)("strong",{children:"Quantity"})}),Object(E.jsx)(h.a,{className:"InverseInput Input Dark",value:Vt,placeholder:"0",addonAfter:Object(E.jsx)(o.a,{defaultValue:"USD",className:"select-after",children:Object(E.jsx)(Y,{value:"USD",children:"USD"})}),onChange:function(e){Et(e.target.value),Qt(1)}}),Object(E.jsx)("br",{}),Object(E.jsxs)("p",{children:["Your current exchange rate is 1 USD = ",et," ",vt]}),Object(E.jsxs)(g.a.Group,{onChange:function(e){return Lt(e.target.value)},className:"RadioGroup Dark",optionType:"button",buttonStyle:"solid",value:Tt,children:[Object(E.jsx)(g.a.Button,{className:"BuyButton",value:"long",children:"Buy / Long"}),Object(E.jsx)(g.a.Button,{className:"SellButton",value:"short",children:"Sell / Short"})]}),Object(E.jsx)("br",{}),Object(E.jsx)("br",{}),Object(E.jsx)("p",{children:Object(E.jsxs)("strong",{children:[zt,"x Leverage"]})}),Object(E.jsx)(O.a,{defaultValue:1,min:1,onAfterChange:function(e){Ut(e),Qt(2)}}),Object(E.jsx)("br",{}),Object(E.jsx)(m.a,{size:"large",disabled:!Mn.connected,onClick:function(){return Vn.apply(this,arguments)},className:"InverseButton Button Dark",type:"ghost",children:"Approve"})]})})}),Object(E.jsx)(f.a,{span:1}),Object(E.jsx)(f.a,{span:3,children:Object(E.jsxs)(l.a,{direction:"vertical",current:Ht,children:[Object(E.jsx)(G,{title:"Quantity",description:Yn},"set"),Object(E.jsx)(G,{title:"Leverage",description:zn},"collateral"),Object(E.jsx)(G,{title:"Approve",description:Gn},"order")]})})]}):Object(E.jsx)(f.a,{span:12,className:"Cards",children:Object(E.jsx)("div",{className:"site-card-border-less-wrapper",children:Object(E.jsx)(x.a,{title:Hn,className:"Card Dark",bordered:!1,extra:Object(E.jsx)("a",{href:"/#/inverse",className:"CardLink",onClick:function(){return Kt("inverse")},children:"Inverse"})})})}),Object(E.jsx)(f.a,{span:6})]})]}),Rn=Object(E.jsxs)(p.a,{children:[Object(E.jsx)(f.a,{span:8}),Object(E.jsx)(f.a,{span:8,className:"Cards",children:Object(E.jsx)("div",{className:"site-card-border-less-wrapper",children:Object(E.jsxs)(x.a,{className:"Card Dark",title:Hn,bordered:!1,extra:Object(E.jsx)("a",{href:"/#/bond",className:"CardLink",onClick:function(e){},children:"Positions"}),children:[Object(E.jsx)(h.a,{className:"StakeInput Input Dark",value:me,placeholder:"0",onChange:function(e){return pe(e.target.value)}}),Object(E.jsx)("br",{}),Object(E.jsxs)("p",{children:["Your current balance is ",Object(E.jsx)("strong",{children:a>0?(a/1).toFixed(2):0})]}),Object(E.jsx)(m.a,{size:"large",disabled:!Mn.connected,className:"ApproveButton Button Dark",type:"ghost",onClick:function(){return En.apply(this,arguments)},children:"Approve"})]})})}),Object(E.jsx)(f.a,{span:8})]}),Xn=Object(E.jsxs)("small",{children:["Your deposit of ",Object(E.jsxs)("span",{className:"White",children:[un>0?(un/1).toFixed(2):0," ",R.symbol.toUpperCase()]}),"\xa0 is set to earn ",Object(E.jsx)("span",{className:"White",children:"12% APY"})]}),Zn=Object(E.jsxs)(p.a,{children:[Object(E.jsx)(f.a,{span:6}),"stake"===cn?Object(E.jsxs)(E.Fragment,{children:[Object(E.jsx)(f.a,{span:4,children:Object(E.jsxs)(l.a,{direction:"vertical",current:mn,children:[Object(E.jsx)(G,{title:"Quantity",description:Xn},"set"),Object(E.jsx)(G,{title:"Approve",description:Gn},"deposit")]})}),Object(E.jsx)(f.a,{span:1}),Object(E.jsx)(f.a,{span:7,className:"Cards",children:Object(E.jsx)("div",{className:"site-card-border-less-wrapper",children:Object(E.jsxs)(x.a,{className:"Card Dark",title:R.symbol,bordered:!1,extra:Object(E.jsx)("a",{href:"/#/stake",className:"CardLink",onClick:function(){return rn("positions")},children:"Positions"}),children:[Object(E.jsx)(h.a,{className:"StakeInput Input Dark",value:un,placeholder:"0",onChange:function(e){pn(1),bn(e.target.value)}}),Object(E.jsx)("br",{}),Object(E.jsxs)("p",{children:["Your current balance is ",Object(E.jsx)("strong",{children:a>0?(a/1).toFixed(2):0})]}),Object(E.jsx)(m.a,{size:"large",disabled:!Mn.connected,className:"ApproveButton Button Dark",type:"ghost",onClick:function(){return In.apply(this,arguments)},children:"Approve"})]})})})]}):Object(E.jsx)(f.a,{span:12,className:"Cards",children:Object(E.jsx)(x.a,{className:"Card Dark",title:R.symbol,bordered:!1,extra:Object(E.jsx)("a",{href:"/#/stake",className:"CardLink",onClick:function(){return rn("stake")},children:"Stake"})})}),Object(E.jsx)(f.a,{span:6})]}),_n=Object(E.jsx)(E.Fragment,{children:"statistics"===Xe?Object(E.jsxs)(p.a,{children:[Object(E.jsx)(f.a,{span:2}),Object(E.jsx)(f.a,{span:20,className:"Cards",children:Object(E.jsx)("div",{className:"site-card-border-less-wrapper",children:Object(E.jsxs)(x.a,{className:"Card Dark",title:"DAO",bordered:!1,extra:Object(E.jsx)("a",{href:"/#/dao",className:"CardLink",onClick:function(){return Ze("vote")},children:"Vote"}),children:[Object(E.jsxs)(p.a,{children:[Object(E.jsxs)(f.a,{span:6,children:[Object(E.jsx)("p",{children:"Market Cap"}),Object(E.jsx)(z,{level:3,className:"Title Dark",children:Ce})]}),Object(E.jsxs)(f.a,{span:6,children:[Object(E.jsxs)("p",{children:[R.symbol," Price"]}),Object(E.jsx)(z,{level:3,className:"Title Dark",children:Se})]}),Object(E.jsxs)(f.a,{span:6,children:[Object(E.jsx)("p",{children:"Circulating Supply (Total)"}),Object(E.jsx)(z,{level:3,className:"Title Dark",children:he})]}),Object(E.jsxs)(f.a,{span:6,children:[Object(E.jsx)("p",{children:"Markets"}),Object(E.jsx)(z,{level:3,className:"Title Dark",children:hn})]})]}),Object(E.jsx)("br",{}),Object(E.jsxs)(p.a,{children:[Object(E.jsxs)(f.a,{span:12,children:[Object(E.jsx)("p",{children:"Total Value Deposited"}),Object(E.jsx)(K.a,{height:100,data:re,options:ae})]}),Object(E.jsxs)(f.a,{span:12,children:[Object(E.jsx)("p",{children:"Market Value of Treasury Assets"}),Object(E.jsx)(K.a,{height:100,data:ce,options:ae})]})]})]})})}),Object(E.jsx)(f.a,{span:2})]}):Object(E.jsxs)(p.a,{children:[Object(E.jsx)(f.a,{span:2}),Object(E.jsx)(f.a,{span:20,className:"Cards",children:Object(E.jsx)("div",{className:"site-card-border-less-wrapper",children:Object(E.jsx)(x.a,{className:"Card Dark",title:"DAO",bordered:!1,extra:Object(E.jsx)("a",{href:"/#/dao",className:"CardLink",onClick:function(e){return Ze("statistics")},children:"Statistics"}),children:Object(E.jsx)(y.b,{itemLayout:"horizontal",dataSource:se,renderItem:function(e){return Object(E.jsxs)(y.b.Item,{children:[Object(E.jsx)(y.b.Item.Meta,{title:e.title,description:e.description}),e.icon]})}})})})}),Object(E.jsx)(f.a,{span:2})]})});return Object(B.useEffect)((function(){Cn(),vn(),An(),gt||(Ot(!0),He(I.exchanges.find((function(e){return e.symbol===ne}))),Nn(ne))}),[Cn,vn,An,Nn,gt,Je.token,Je.accountV]),Object(B.useEffect)((function(){nn(oe())}),[nn]),Object(B.useEffect)((function(){wn().then((function(e){if(!ue)try{be(!0),setInterval((function(){e.connection.getEpochInfo().then((function(e){T(e.blockHeight)}))}),1e4)}catch(t){Tn()}}))}),[ue,wn]),Object(B.useEffect)((function(){if(!qe)try{Ve(!0),setInterval((function(){!function(){var e=new Date,t=new Date;t.setHours(24,0,0,0);var n=t.getTime()-e.getTime(),a=Math.floor(n%864e5/36e5),s=Math.floor(n%36e5/6e4),c=Math.floor(n%6e4/1e3);Te(("0"+a).slice(-2)+":"+("0"+s).slice(-2)+":"+("0"+c).slice(-2))}()}),1e3)}catch(e){Tn()}}),[qe,Ve]),Object(E.jsxs)(i.a,{className:"App Dark",children:[ee?Object(E.jsx)(S.a,{type:"info",className:"Banner",closable:!0,message:Object(E.jsxs)("span",{children:["You are currently using an unaudited piece of software via ",_,". Use at your own risk."]})}):null,Object(E.jsx)(Q,{className:"Header Dark",children:Object(E.jsxs)(p.a,{children:[Object(E.jsx)(f.a,{span:5,children:Object(E.jsxs)("div",{className:"Logo Dark",children:[Object(E.jsx)("img",{src:"/logo.svg",alt:"Logo",className:"LogoImage"}),Object(E.jsx)("strong",{className:"LogoText",onClick:function(){return window.open(Z,"_blank")},children:"cheru\u03b2"})]})}),Object(E.jsx)(f.a,{span:14,className:"ColCentered",children:Object(E.jsxs)(j.a,{className:"Menu Dark",onClick:function(e){nn(e.key),window.location.href="/#/"+e.key},selectedKeys:[tn],mode:"horizontal",children:[Object(E.jsx)(j.a.Item,{children:"DAO"},"dao"),Object(E.jsx)(j.a.Item,{children:"Inverse Perpetuals"},"inverse"),Object(E.jsx)(j.a.Item,{children:"Bond"},"bond"),Object(E.jsx)(j.a.Item,{onClick:function(){At(R.symbol)},children:"Stake"},"stake")]})}),Object(E.jsxs)(f.a,{span:5,className:"ConnectWalletHeader",children:[Mn.connected?Object(E.jsxs)(m.a,{className:"ConnectWalletButton",type:"link",children:[Object(E.jsxs)("code",{className:"SolCount",children:[a>0?(a/1).toFixed(2):0," ",vt]}),Object(E.jsxs)("code",{children:[Mn.publicKey.toString().substr(0,4),"...",Mn.publicKey.toString().substr(-4)]})]}):Object(E.jsxs)(E.Fragment,{children:[Object(E.jsx)(F.WalletMultiButton,{className:"WalletMultiButton"}),Object(E.jsx)(m.a,{className:"ConnectWalletButton",onClick:function(e){return document.getElementsByClassName("WalletMultiButton")[0].click()},type:"link",children:"Connect Wallet"})]}),Object(E.jsx)(k.a,{className:"Dropdown SettingsDropdown",overlay:Jn,children:Object(E.jsx)(N.a,{})})]})]})}),Object(E.jsx)(i.a,{className:"Layout Dark",children:Object(E.jsx)(J,{children:Object(E.jsxs)("div",{children:[Object(E.jsx)("br",{}),Object(E.jsx)("br",{}),"inverse"===tn?Un:null,"stake"===tn?Zn:null,"bond"===tn?Rn:null,"dao"===tn?_n:null]})})}),Object(E.jsx)(H,{className:"Footer",children:Object(E.jsx)("code",{className:"BlockHeight",children:Object(E.jsxs)("small",{children:["\u2022 ",v]})})}),Object(E.jsx)(M.a,{title:"Assets",footer:null,visible:pt,onCancel:function(){ft(!1)},children:Object(E.jsx)(y.b,{itemLayout:"horizontal",dataSource:I.exchanges,forcerender:"true",renderItem:function(e){return Object(E.jsx)(y.b.Item,{className:"Asset ListItem",children:Object(E.jsx)(y.b.Item.Meta,{title:e.symbol,onClick:function(){At(e.symbol),Wn(e.symbol),ft(!1),He(I.exchanges.find((function(t){return t.symbol===e.symbol})))}})})}})})]})}t.a=function(){return Object(E.jsx)(D.ConnectionProvider,{endpoint:_,children:Object(E.jsx)(D.WalletProvider,{wallets:te,autoConnect:!0,children:Object(E.jsx)(F.WalletModalProvider,{children:Object(E.jsx)(le,{})})})})}}).call(this,n(13).Buffer)},518:function(e,t,n){},520:function(e,t){},521:function(e,t){},540:function(e,t){},541:function(e,t){},671:function(e,t){},672:function(e,t){},685:function(e,t){},686:function(e,t){},780:function(e,t){},782:function(e,t){},798:function(e,t){},802:function(e,t){},804:function(e,t){},814:function(e,t){},816:function(e,t){},843:function(e,t){},845:function(e,t){},850:function(e,t){},852:function(e,t){},859:function(e,t){},871:function(e,t){},874:function(e,t){},886:function(e,t){},888:function(e,t,n){},890:function(e){e.exports=JSON.parse('{"exchanges":[{"account":"F4Wc446KDZGbP9V4gzkqb2z69qe2zTVjfmHzv3F3sRm1","accountA":"zJ7mc11Xc3TtGheGk3EJDDRtk7iE4GPjqagsXFiTowP","accountB":"FWcuqnPM7yJjD9UsoBQRq24TcopvBSXw5CRu6nL4c41N","accountV":"J9JrMoDn8GQTyGGPxiehKiMakf1YqzvYzM1P3xoiVtj6","token":"So11111111111111111111111111111111111111112","tokenA":"7bqnXAcb5FWoanepYZVsLsDdMSVZspkJdnhJ2fQqBjKt","tokenB":"SQLoJKMdCo4qfujJugBNo2Fg9nje5B7SSrHzSRTo5Pw","tokenV":"So11111111111111111111111111111111111111112","symbol":"SOL"},{"account":"JDGSNxbns1j9pK3h9q5mqRHSeuofL117BUZthswa3MXY","accountA":"2qgPAEvpW7QAWps9UVkKa3UDZb56HVfM3YBxpmbj5X5N","accountB":"BNKZJhg9qtND52kFd5nys7C2Qv3sVUyX2NteutbJR1Q3","accountV":"E71sWuUSnuJ3rqqAWf2HTYzEdMcfRA52eNnGG1GfHasf","symbol":"CHRB","token":"12xQgsWkjf17UwhZL1KYQwdTQcxAPjVjTsUnssEvXmnx","tokenA":"9Yga7cNyZN6nAq9RFyCwiYrRcFckQ1iVowS99HHiz724","tokenB":"2wDpfxaLwCeBuXBBT9gjp5BeU7DG1E5AnZ8GgjsaeYxe","tokenV":"12xQgsWkjf17UwhZL1KYQwdTQcxAPjVjTsUnssEvXmnx"}],"factory":{"account":"Adw9JP7dbxZMXCqJwtr3cdzDVF8Fh3McziQgBh2vQPCU","accountC":"uyZuqFozeftCyZHabeGqwboA1vL5ZDnbLaSto4uWB6M","tokenC":"12xQgsWkjf17UwhZL1KYQwdTQcxAPjVjTsUnssEvXmnx","tokenS":"9323rWGjkuDhEQsevyCAp6zqoxsQfFPurDbTX6jEAVX8"},"pyth":{"account":"CwM3mteZaG355FwjaUNsFaAfLwczWgBVrzUjM4EYMMyH"}}')},891:function(e){e.exports=JSON.parse('{"exchanges":[{"exchange":"4FXH9B4g77fHcvxPsParPbVLq9kjRSRJ5TD8HJo3pqd3","index":0,"mintA":"9V89AtAzkc6186J3vmKqd2uDzgnEqStUUNbX4FeBFyRM","mintB":"J26Ep9dmDWZmDNgNusqscKYPPE5Xd8oXwy1pQy9rFjyD","mintV":"So11111111111111111111111111111111111111112","symbol":"SOL","tokenA":"nHfbEFRQDck1WtYjapcQbnLMYr5M9LsCx5iLXNM419x","tokenB":"6Xu6jLfLGAmmz38y5rL8UwYDufmf34VgLsQTnGwikn9X","tokenV":"B1f8HVLjWYy2m4g5gcQctC6basqnTK82NpWG65QJ78Ea","walletA":"Hi2vN7yxfnYJKafH8dZwuKWAJF2M7thW6CVrrrBVkN9A","walletB":"CAQxfpryh1gJQ5jmFMpfrcthjPkAnLtQgyrDVaS8JZhd","walletV":"7HsmYA2ge1LW7FJPd9r5BCWgF2jAF7C4c3MntB7ENfMi","token":"So11111111111111111111111111111111111111112"},{"exchange":"FfjbJouWd9p6EicG2FFXD2fLd5RQ5vLffnRtkJ97otaK","index":1,"mintA":"BhgQZVDSXYQA3pF8qmwfNcsTAmdW2D6ozq2dPuebEPh3","mintB":"4rjcc6v21TcAgE577hD7FftMxxVh545vNEMQT7CZB3W5","mintV":"CCvxmDKeqUWWqqgh9Fm99csWcnS2Tq3brvYKZabthRJ5","symbol":"CHRB","tokenA":"GLo45rnyRaYUag5H5wvEvJiudbQxA1WGeJotDSaG6cLe","tokenB":"FaMFf6juzXT8RvLX2PMByKiwdWHBubJdERD8HWAq8bTz","tokenV":"Du68DVDH4wna5dWvUaijsmnfwb2bsEGn2VbW5Bad5WuV","walletA":"3NcD9F6vC7RDT5HYf72yhz4cnJqy6tgovoeCgPAE1Qw4","walletB":"CbFKo9aTJJjkQFVq4bkSLSqFXndALHJHqqvyWsTFMQiH","walletV":"3qA9rtjQFdxXys41mrdZibivLcuEXEpDcX28S4bZ6G5c","token":"CCvxmDKeqUWWqqgh9Fm99csWcnS2Tq3brvYKZabthRJ5"}],"factory":"HinHcAvipcFgXQudr7fhmweaHxvsAqwXfFq34yLGZMWB","factoryC":"8Lnhs8nFkraBUjma9cNz7tmDHJNh9fKpzmLjfx5FW6ee","mintC":"CCvxmDKeqUWWqqgh9Fm99csWcnS2Tq3brvYKZabthRJ5","mintS":"DW2XJCuSsQgm4L6hRRzibvJ6M8ui1FUQCDVMiRCRrmeD","pyth":"5p5BLnGxPRoF5DVnj91GQzRjETL37c6H1CZRWZBNo2Cx","trader":"3eqz4xVTHzgmNxY6bcdn73u3pdjXtkG5CEeUhkJfFCnL","walletC":"3qA9rtjQFdxXys41mrdZibivLcuEXEpDcX28S4bZ6G5c","walletS":"CVPHK82rbEzCuq4Zh6VWZnwgat1EKQHE5ig1nGcg62Ky"}')},967:function(e,t,n){"use strict";n.r(t);var a=n(0),s=n.n(a),c=n(50),r=n.n(c),i=(n(518),n(494)),o=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,980)).then((function(t){var n=t.getCLS,a=t.getFID,s=t.getFCP,c=t.getLCP,r=t.getTTFB;n(e),a(e),s(e),c(e),r(e)}))},l=n(9);r.a.render(Object(l.jsx)(s.a.StrictMode,{children:Object(l.jsx)(i.a,{})}),document.getElementById("root")),o()}},[[967,1,2]]]);
//# sourceMappingURL=main.c96b8365.chunk.js.map