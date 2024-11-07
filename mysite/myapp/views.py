from django.shortcuts import render, HttpResponse, redirect

def redirect_view(request):
    response = redirect('/myapp/home')
    return response

def	home(request):
	return render(request, "home.html")

def	home2(request):
	return render(request, "home2.html")

def	home3(request):
	return render(request, "home3.html")