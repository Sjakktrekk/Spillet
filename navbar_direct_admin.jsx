useEffect(() => {
  const checkAdmin = async () => {
    if (!user) return;
    
    const userId = user.id;
    // Hardkoder admin-ID for testing
    if (userId === '4105763b-0041-498e-8d7f-a9448565903d') {
      console.log('Admin-bruker oppdaget');
      setIsAdmin(true);
    }
  };

  checkAdmin();
}, [user]); 