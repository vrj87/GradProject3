import type { OrderStatus } from "../lib/placedOrders";

export type { OrderStatus };

export interface Order {
  id: string;
  productId: string;
  size: string;
  qty: number;
  status: OrderStatus;
  placedOn: string;
  updatedOn: string;
  payment: string;
}

/** Past buys for Priya — none of these are on the current wishlist shortlist. */
export const ORDERS: Order[] = [
  {
    id: "4412-882910-1033",
    productId: "w-jean-1",
    size: "28",
    qty: 1,
    status: "Delivered",
    placedOn: "Sat, 2 Aug 2026",
    updatedOn: "Tue, 5 Aug 2026",
    payment: "UPI"
  },
  {
    id: "4412-771204-8841",
    productId: "w-top-1",
    size: "S",
    qty: 1,
    status: "Delivered",
    placedOn: "Fri, 11 Jul 2026",
    updatedOn: "Mon, 14 Jul 2026",
    payment: "Card"
  },
  {
    id: "4412-660118-2290",
    productId: "w-dress-2",
    size: "M",
    qty: 1,
    status: "Returned",
    placedOn: "Wed, 18 Jun 2026",
    updatedOn: "Sat, 28 Jun 2026",
    payment: "UPI"
  },
  {
    id: "4412-559003-4412",
    productId: "w-bag-2",
    size: "OS",
    qty: 1,
    status: "Delivered",
    placedOn: "Sun, 4 May 2026",
    updatedOn: "Wed, 7 May 2026",
    payment: "Card"
  },
  {
    id: "4412-448872-0198",
    productId: "w-ear-1",
    size: "OS",
    qty: 1,
    status: "Delivered",
    placedOn: "Thu, 12 Mar 2026",
    updatedOn: "Sun, 15 Mar 2026",
    payment: "UPI"
  },
  {
    id: "4412-337761-5560",
    productId: "w-heel-1",
    size: "UK 5",
    qty: 1,
    status: "Cancelled",
    placedOn: "Mon, 9 Feb 2026",
    updatedOn: "Mon, 9 Feb 2026",
    payment: "UPI"
  }
];
