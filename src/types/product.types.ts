export type IProduct = {
  measurement: any
  _id: string
  name: string
  description?: string
  category: ICategory
  brand?: IBrand
  price: number
  size?: string
  stock: number
  seller: ISeller
}

export interface IMeasurement {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface IUnit {
    _id: string;
    name: string;
    symbol: string;
    measurementId: string;
    createdAt: string;
    updatedAt: string;
  }
  
export interface ISeller {
  _id: string
  name: string
  email: string
  contactNo: string
}

export interface ICategory {
  _id: string
  name: string
}

export interface IBrand {
  _id: string
  name: string
}
export interface IExpense {
  _id: string;
  date: string;
  expenseName: string;
  description: string;
  expensePrice: number;
}