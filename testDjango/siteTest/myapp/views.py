from django.shortcuts import render

# Create your views here.

def home(request):
    return render(request, 'slider.html')

def theme1(request):
    return render(request, 'theme1.html')

def theme2(request):
    return render(request, 'theme2.html')

def theme3(request):
    return render(request, 'theme3.html')
