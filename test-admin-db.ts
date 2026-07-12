import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const app = initializeApp({ projectId: "demo-test" });
try {
  const db = getFirestore(app, "my-database");
  console.log("Success with 2 args:", db.databaseId);
} catch (e: any) {
  console.error("Failed with 2 args:", e.message);
  try {
     const db2 = getFirestore("my-database");
     console.log("Success with 1 string arg:", db2.databaseId);
  } catch (e2: any) {
     console.log("Failed with 1 string arg:", e2.message);
  }
}
