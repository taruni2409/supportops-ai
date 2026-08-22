import pandas as pd
import numpy as np
import sklearn


def main():
    print("SupportOps AI environment is ready!")

    print(f"Pandas version: {pd.__version__}")
    print(f"NumPy version: {np.__version__}")
    print(f"Scikit-learn version: {sklearn.__version__}")


if __name__ == "__main__":
    main()