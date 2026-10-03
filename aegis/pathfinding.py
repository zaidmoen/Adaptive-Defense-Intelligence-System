import heapq
import math
from .terrain import cost

def astar(grid,start,goal,kind):
    """Four-neighbor A*: Manhattan lower bound and terrain movement costs."""
    start=tuple(map(round,start));goal=tuple(map(round,goal))
    queue=[(0,start)];previous={};g={start:0}
    while queue:
        _,node=heapq.heappop(queue)
        if node==goal:
            path=[]
            while node!=start:
                path.append(node);node=previous[node]
            return path[::-1]
        x,y=node
        for nx,ny in [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]:
            if not (0<=ny<len(grid) and 0<=nx<len(grid[0])):continue
            candidate=g[node]+cost(grid,nx,ny,kind)
            if candidate<g.get((nx,ny),math.inf):
                g[nx,ny]=candidate;previous[nx,ny]=node
                h=abs(goal[0]-nx)+abs(goal[1]-ny)
                heapq.heappush(queue,(candidate+h,(nx,ny)))
    return []
