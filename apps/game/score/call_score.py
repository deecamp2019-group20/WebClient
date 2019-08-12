from .decomposer import Decomposer
from .evaluator import cards_value

val2char = {
    3:'3', 4:'4', 5:'5', 6:'6', 7:'7',
    8:'8', 9:'9', 10:'10', 11:'J', 12:'Q',
    13:'K', 14:'A', 15:'2', 16:'*', 17:'$'
}

def call_score(handcard):
    handcards = [val2char[c] for c in handcard]
    D = Decomposer()
    combs, mask = D.get_combinations(handcards, [])
    max_value = -float('inf')

    for i in range(len(combs)):
        total_value = sum([cards_value[x] for x in combs[i]])
        if total_value > max_value:
            max_value = total_value
            index = i
    if max_value > 17:
        return 3
    if max_value > 15:
        return 2
    if max_value > 13:
        return 1
    return 0


