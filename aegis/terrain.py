import math
import random

WIDTH, HEIGHT = 60, 40

def terrain(seed):
    rng = random.Random(seed)
    grid = [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]
    for cx, cy, r, kind in [(15,8,5,2),(29,28,7,1),(41,12,5,1)]:
        for y in range(HEIGHT):
            for x in range(WIDTH):
                if math.hypot(x-cx,y-cy)<r + rng.uniform(-.8,.8):
                    grid[y][x]=kind
    for y in range(HEIGHT):
        if y not in range(8,13) and y not in range(25,30):
            grid[y][33]=3
    return grid

def cost(grid,x,y,kind):
    t=grid[y][x]
    if t==3: return math.inf
    return (1, 2.5 if kind=="heavy" else 1.7, 1.8 if kind=="heavy" else 1.3)[t]

def visible(grid,a,b):
    steps=max(1,int(math.dist(a,b)*3))
    for i in range(1,steps):
        x=round(a[0]+(b[0]-a[0])*i/steps)
        y=round(a[1]+(b[1]-a[1])*i/steps)
        if grid[y][x]==3: return False
    return True
