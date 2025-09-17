@@ .. @@
     // Get current user from token
-    const currentUser = getCurrentUser();
+    const currentUser = await getCurrentUser();
     
     if (!currentUser) {
     }