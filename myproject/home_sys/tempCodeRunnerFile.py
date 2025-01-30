class Users(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
	name = models.CharField(max_length=150)
	date = models.DateTimeField(auto_now_add=True)
	image = models.CharField(max_length=255, default='static/images/basePP.png')
	status = models.BooleanField(default=True)
	win_nb = models.IntegerField(default=0)
	lose_nb = models.IntegerField(default=0)
