from .models import Squad,Unit

SCENARIOS={"ridge":{"allies":150,"enemies":180},"siege":{"allies":250,"enemies":350},"stress":{"allies":500,"enemies":500}}

def create_squads(name):
    spec=SCENARIOS[name];squads=[];uid=0
    for side,key in [("ally","allies"),("enemy","enemies")]:
        remaining=spec[key];i=0
        while remaining:
            n=min(25,remaining);remaining-=n
            kind=("scout","infantry","heavy")[i%3]
            x=(16 if i==0 else 8+(i%3)*3) if side=="ally" else 48+(i%3)*3
            y=(8 if i==0 else 15+(i*4)%19) if side=="ally" else 5+(i*5)%30
            squads.append(Squad(f"{side[0].upper()}{i+1:02}",side,kind,x,y,[Unit(j) for j in range(uid,uid+n)]))
            uid+=n;i+=1
    return squads
