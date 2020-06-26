

class Hook:
    d = {}

    @staticmethod
    def hook(s: str, func):
        Hook.d[s] = func

    @staticmethod
    def get(s: str):
        return Hook.d[s]